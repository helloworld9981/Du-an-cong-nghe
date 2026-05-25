import { ObjectId } from 'mongodb';
import { Contest } from '../models/contest.model';
import { Team, TeamMember } from '../models/team.model';
import { contestData } from '../data/contest.data';
import { teamData } from '../data/team.data';
import { userData } from '../data/user.data';
import { redisService } from './redis.service';
import { individualContestActivityData } from '../data/individual-contest-activity.data';
import { IndividualContestActivity } from '../models/individual-contest-activity.model';
import { teamMemberActivityService } from './team-member-activity.service';
import { createLogger } from '../utils/logger';
import { validateRouteMatch } from './route-match.service';
import { RecordTypes } from '../models/workout-activity.model';

const logger = createLogger('ContestService');

export class ContestService {
    private readonly teamCollection = 'teams';

    async createContest(contest: Omit<Contest, '_id' | 'createdAt' | 'updatedAt'>): Promise<Contest> {
        const newContestData = {
            ...contest,
            numberOfTeams: 0,
            numberOfParticipants: 0,
            teamIds: [],
            participantIds: []
        };
        const newContestId = await contestData.create(newContestData);
        const createdContest = await contestData.findById(newContestId);
        if (!createdContest) {
            throw new Error('Failed to create contest');
        }
        return createdContest;
    }

    async getContest(contestId: ObjectId): Promise<Contest | null> {
        return await contestData.findById(contestId);
    }

    async updateContest(contestId: ObjectId, update: Partial<Contest>): Promise<Contest | null> {
        const success = await contestData.update(contestId, update);
        if (!success) {
            return null;
        }
        return await contestData.findById(contestId);
    }

    async deleteContest(contestId: ObjectId): Promise<boolean> {
        const contest = await this.getContest(contestId);
        if (!contest) {
            return false;
        }


        // Cascade delete all associated data
        try {
            // Get all teams for this contest to get affected users before deletion
            const teams = await teamData.findByContestId(contestId);
            const affectedUserIds = new Set<ObjectId>();
            
            // Collect all user IDs from team members for cache cleanup
            teams.forEach(team => {
                team.members.forEach(member => {
                    affectedUserIds.add(member.userId);
                });
            });


            // Delete individual contest activities
            await individualContestActivityData.deleteByContestId(contestId);

            // Delete team member activities
            await teamMemberActivityService.deleteByContestId(contestId);

            // Delete all teams for this contest
            await teamData.deleteByContestId(contestId);

            // Delete the contest itself
            const deleted = await contestData.delete(contestId);

            // Clean up Redis cache for affected users
            if (deleted && affectedUserIds.size > 0) {
                await this.cleanupCacheForUsers(Array.from(affectedUserIds));
            }

            return deleted;
        } catch (error) {
            logger.error('Error during cascade delete of contest', 'deleteContest', { contestId, error });
            throw new Error('Failed to delete contest and associated data');
        }
    }

    async createTeam(contestId: ObjectId, team: Omit<Team, '_id' | 'contestId' | 'createdAt' | 'updatedAt'>): Promise<Team | null> {
        const contest = await this.getContest(contestId);
        if (!contest) {
            throw new Error('Contest not found');
        }

        if (this.hasContestStarted(contest)) {
            throw new Error('Cannot create team after contest has started');
        }

        const newTeam = {
            ...team,
            groupId: contest.groupId,
            contestId,
            numberOfMember: 0,
            members: [],
            averagePace: 0,
            totalDistance: 0,
            totalTracklog: 0,
            fastestPace: 0,
            maxDistance: 0
        };

        const teamId = await teamData.create(newTeam);
        await contestData.update(contestId, {
            numberOfTeams: (contest.numberOfTeams || 0) + 1,
            teamIds: [...(contest.teamIds || []), teamId]
        });

        return await teamData.findById(teamId);
    }

    async addMemberToTeam(teamId: ObjectId, userId: ObjectId): Promise<boolean> {
        const team = await this.getTeam(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        const contest = await this.getContest(team.contestId);
        if (!contest || this.hasContestStarted(contest)) {
            throw new Error('Cannot modify team after contest has started');
        }

        const newMember: TeamMember = {
            userId,
            joinedAt: new Date()
        };

        const success = await teamData.addMember(teamId, newMember);
        if (success) {
            await contestData.update(team.contestId, {
                numberOfParticipants: (contest.numberOfParticipants || 0) + 1
            });

            // Update Redis cache
            try {
                await this.updateUserTeamsCache(userId);
            } catch (error) {
                logger.error('Redis cache update error when adding member to team', 'addMemberToTeam', { teamId, userId, error });
                // Continue even if Redis fails, as it's just a cache
            }
        }
        return success;
    }

    async addMultipleMembersToTeam(teamId: ObjectId, userIds: ObjectId[]): Promise<{ 
        successful: string[], 
        failed: { userId: string, reason: string }[] 
    }> {
        const team = await this.getTeam(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        const contest = await this.getContest(team.contestId);
        if (!contest || this.hasContestStarted(contest)) {
            throw new Error('Cannot modify team after contest has started');
        }

        const successful: string[] = [];
        const failed: { userId: string, reason: string }[] = [];
        const joinedAt = new Date();

        // Process each user
        for (const userId of userIds) {
            try {
                // Check if user is already in team
                const isAlreadyMember = team.members.some(member => member.userId.toString() === userId.toString());
                if (isAlreadyMember) {
                    failed.push({ userId: userId.toString(), reason: 'User is already a team member' });
                    continue;
                }

                const newMember: TeamMember = {
                    userId,
                    joinedAt
                };

                const success = await teamData.addMember(teamId, newMember);
                if (success) {
                    successful.push(userId.toString());
                } else {
                    failed.push({ userId: userId.toString(), reason: 'Failed to add user to team' });
                }
            } catch (error) {
                failed.push({ 
                    userId: userId.toString(), 
                    reason: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        }

        // Update contest participant count with successful additions
        if (successful.length > 0) {
            await contestData.update(team.contestId, {
                numberOfParticipants: (contest.numberOfParticipants || 0) + successful.length
            });
        }

        return { successful, failed };
    }

    async removeMemberFromTeam(teamId: ObjectId, userId: ObjectId): Promise<boolean> {
        const team = await this.getTeam(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        const contest = await this.getContest(team.contestId);
        if (!contest || this.hasContestStarted(contest)) {
            throw new Error('Cannot modify team after contest has started');
        }

        const success = await teamData.removeMember(teamId, userId);
        if (success) {
            await contestData.update(team.contestId, {
                numberOfParticipants: (contest.numberOfParticipants || 0) - 1
            });

            // Update Redis cache
            try {
                await this.updateUserTeamsCache(userId);
            } catch (error) {
                logger.error('Redis cache update error when removing member from team', 'removeMemberFromTeam', { teamId, userId, error });
                // Continue even if Redis fails, as it's just a cache
            }
        }
        return success;
    }

    /**
     * Update user teams cache in Redis
     * @param userId User ID to update teams for
     */
    private async updateUserTeamsCache(userId: ObjectId): Promise<void> {
        // Get all teams the user is a member of
        const teams = await teamData.findByMemberId(userId);

        if (teams.length > 0) {
            // Get team IDs
            const teamIds = teams.map(team => team._id as ObjectId);

            // Cache in Redis
            await redisService.cacheUserTeams(userId, teamIds);
        } else {
            // If user has no teams, delete the cache entry
            await redisService.deleteUserTeamsCache(userId);
        }
    }

    private async getTeam(teamId: ObjectId): Promise<Team | null> {
        return await teamData.findById(teamId);
    }

    private hasContestStarted(contest: Contest): boolean {
        return contest.startAt <= new Date();
    }

    private contestRequiresRoute(contest: Contest): boolean {
        return !!(
            contest.route &&
            Array.isArray(contest.route.polyline) &&
            contest.route.polyline.length > 1
        );
    }

    private validateContestRouteIfNeeded(contest: Contest, workoutActivity: any): {
        shouldCount: boolean;
        routeMatchResult?: {
            isMatched: boolean;
            matchPercent: number;
            matchedCheckpoints: number;
            totalCheckpoints: number;
            missedCheckpoints: number[];
        };
    } {
        const requiresRoute = this.contestRequiresRoute(contest);

        // Contest thường không yêu cầu tuyến đường chạy XD
        if (!requiresRoute) {
            return {
                shouldCount: true,
                routeMatchResult: undefined,
            };
        }

        // Contest có tuyến đường hoạt động tạo từ hệ thống RunTracker.
        if (workoutActivity.recordType !== RecordTypes.System) {
            return {
                shouldCount: false,
                routeMatchResult: undefined,
            };
        }

        // RunTracker gửi raw GPS points so sánh dữ liệu 
        if (
            !Array.isArray(workoutActivity.routePoints) ||
            workoutActivity.routePoints.length < 2
        ) {
            return {
                shouldCount: false,
                routeMatchResult: undefined,
            };
        }

        const routeMatchResult = validateRouteMatch(
            contest.route,
            workoutActivity.routePoints
        );

        return {
            shouldCount: routeMatchResult.isMatched,
            routeMatchResult,
        };
    }



    async getTeamsForContest(contestId: ObjectId): Promise<Team[]> {
        this.ensureConnected();
        const contest = await this.getContest(contestId);
        if (!contest) {
            return [];
        }

        // If the contest has no teams, return empty array
        if (!contest.teamIds || contest.teamIds.length === 0) {
            return [];
        }

        // Find all teams that belong to this contest
        const teams = await teamData.findByContestId(contestId);
        
        // Populate member details for each team
        const teamsWithMemberDetails = await Promise.all(
            teams.map(async (team) => {
                const membersWithDetails = await this.populateTeamMemberDetails(team.members);
                return {
                    ...team,
                    members: membersWithDetails
                };
            })
        );
        
        return teamsWithMemberDetails;
    }

    /**
     * Populate team member details with user information
     */
    private async populateTeamMemberDetails(members: TeamMember[]): Promise<any[]> {
        const membersWithDetails = await Promise.all(
            members.map(async (member) => {
                try {
                    const user = await userData.findById(member.userId.toString());
                    if (user) {
                        return {
                            userId: member.userId,
                            joinedAt: member.joinedAt,
                            name: user.stravaProfile?.firstname && user.stravaProfile?.lastname 
                                ? `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`
                                : user.username,
                            username: user.username,
                            stravaProfile: user.stravaProfile
                        };
                    }
                    // Fallback if user not found
                    return {
                        userId: member.userId,
                        joinedAt: member.joinedAt,
                        name: member.userId.toString(),
                        username: member.userId.toString()
                    };
                } catch (error) {
                    logger.error('Error fetching user details for member', 'getTeamMembers', { userId: member.userId, error });
                    // Fallback if error occurs
                    return {
                        userId: member.userId,
                        joinedAt: member.joinedAt,
                        name: member.userId.toString(),
                        username: member.userId.toString()
                    };
                }
            })
        );
        
        return membersWithDetails;
    }

    /**
     * Get all teams for a user from cache or database
     * @param userId User ID
     * @returns Array of teams the user is a member of
     */
    async getUserTeams(userId: ObjectId): Promise<Team[]> {
        // Try to get from Redis cache first
        try {
            const cachedTeamIds = await redisService.getUserTeams(userId);

            if (cachedTeamIds && cachedTeamIds.length > 0) {
                // If we have cached team IDs, get the team details
                const teams: Team[] = [];

                for (const teamId of cachedTeamIds) {
                    const team = await teamData.findById(teamId);
                    if (team) {
                        teams.push(team);
                    }
                }

                return teams;
            }
        } catch (error) {
            logger.error('Error getting user teams from Redis', 'updateUserTeamsCache', { userId, error });
            // Continue to database lookup if Redis fails
        }

        // Fallback to database lookup
        const teams = await teamData.findByMemberId(userId);

        // Update the cache for next time
        try {
            if (teams.length > 0) {
                const teamIds = teams.map(team => team._id as ObjectId);
                await redisService.cacheUserTeams(userId, teamIds);
            }
        } catch (error) {
            logger.error('Error updating Redis cache for user teams', 'updateUserTeamsCache', { userId, error });
            // Continue even if Redis caching fails
        }

        return teams;
    }

    /**
     * Get individual contest leaderboard
     */
    async getIndividualContestLeaderboard(contestId: ObjectId): Promise<{
        userId: ObjectId;
        totalDistance: number;
        totalTracklog: number;
        averagePace: number;
        fastestPace: number;
        maxDistance: number;
        userDetails?: any;
    }[]> {
        const contest = await this.getContest(contestId);
        if (!contest) {
            throw new Error('Contest not found');
        }

        if (contest.contestType !== 'Individual') {
            throw new Error('Contest is not an individual contest');
        }

        const leaderboard = await individualContestActivityData.getContestLeaderboard(contestId);
        
        // Populate user details
        const leaderboardWithDetails = await Promise.all(
            leaderboard.map(async (entry) => {
                try {
                    const user = await userData.findById(entry.userId.toString());
                    return {
                        ...entry,
                        userDetails: user ? {
                            name: user.stravaProfile?.firstname && user.stravaProfile?.lastname 
                                ? `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`
                                : user.username,
                            username: user.username,
                            stravaProfile: user.stravaProfile
                        } : null
                    };
                } catch (error) {
                    logger.error('Error fetching user details for leaderboard', 'getContestLeaderboard', { userId: entry.userId, error });
                    return {
                        ...entry,
                        userDetails: null
                    };
                }
            })
        );

        return leaderboardWithDetails;
    }

    /**
     * Get individual contest stats for a specific user
     */
    async getIndividualContestStats(contestId: ObjectId, userId: ObjectId): Promise<{
        totalDistance: number;
        totalTracklog: number;
        averagePace: number;
        fastestPace: number;
        maxDistance: number;
    }> {
        const contest = await this.getContest(contestId);
        if (!contest) {
            throw new Error('Contest not found');
        }

        if (contest.contestType !== 'Individual') {
            throw new Error('Contest is not an individual contest');
        }

        return await individualContestActivityData.getIndividualStats(contestId, userId);
    }

    /**
     * Get individual contest activities for a specific user
     */
    async getIndividualContestActivities(contestId: ObjectId, userId: ObjectId): Promise<IndividualContestActivity[]> {
        if (!individualContestActivityData.isConnected()) {
            const config = await import('../config/env.config');
            await individualContestActivityData.connect(config.default.MONGODB_URI, config.default.DB_NAME);
        }

        return await individualContestActivityData.findByContestAndUser(contestId, userId);
    }

    /**
     * Add participant to individual contest
     */
    async addParticipantToContest(contestId: ObjectId, participantId: ObjectId): Promise<boolean> {
        logger.info('Starting participant addition to contest', 'addParticipantToContest', { 
            contestId, 
            participantId 
        });
        
        try {
            // Ensure proper ObjectId conversion
            const contestObjectId = typeof contestId === 'string' ? new ObjectId(contestId) : contestId;
            const participantObjectId = typeof participantId === 'string' ? new ObjectId(participantId) : participantId;
            
            logger.debug('ObjectId conversion completed', 'addParticipantToContest', { 
                contestObjectId, 
                participantObjectId 
            });
            
            const contest = await this.getContest(contestObjectId);
            if (!contest) {
                logger.warn('Contest not found for participant addition', 'addParticipantToContest', { 
                    contestId: contestObjectId 
                });
                throw new Error('Contest not found');
            }

            logger.debug('Contest retrieved successfully', 'addParticipantToContest', { 
                contestId: contest._id, 
                contestType: contest.contestType, 
                startAt: contest.startAt 
            });

            if (contest.contestType !== 'Individual') {
                logger.warn('Attempt to add participant to non-individual contest', 'addParticipantToContest', { 
                    contestId: contestObjectId, 
                    contestType: contest.contestType 
                });
                throw new Error('Can only add participants to individual contests');
            }

            const result = await contestData.addParticipant(contestObjectId, participantObjectId);
            
            if (result) {
                logger.info('Successfully added participant to contest', 'addParticipantToContest', { 
                    contestId: contestObjectId, 
                    participantId: participantObjectId 
                });
            } else {
                logger.warn('Failed to add participant to contest', 'addParticipantToContest', { 
                    contestId: contestObjectId, 
                    participantId: participantObjectId 
                });
            }
            
            return result;
            
        } catch (error: any) {
            logger.error('Error adding participant to contest', 'addParticipantToContest', { 
                contestId, 
                participantId, 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    /**
     * Remove participant from individual contest
     */
    async removeParticipantFromContest(contestId: ObjectId, participantId: ObjectId): Promise<boolean> {
        const contest = await this.getContest(contestId);
        if (!contest) {
            throw new Error('Contest not found');
        }

        if (contest.contestType !== 'Individual') {
            throw new Error('Can only remove participants from individual contests');
        }

        return await contestData.removeParticipant(contestId, participantId);
    }

    /**
     * Get all participants for individual contest
     */
    async getContestParticipants(contestId: ObjectId): Promise<any[]> {
        const contest = await this.getContest(contestId);
        if (!contest) {
            throw new Error('Contest not found');
        }

        if (contest.contestType !== 'Individual') {
            throw new Error('Contest is not an individual contest');
        }

        if (!contest.participantIds || contest.participantIds.length === 0) {
            return [];
        }

        // Get user details for all participants
        const participants = await Promise.all(
            contest.participantIds.map(async (participantId) => {
                try {
                    const user = await userData.findById(participantId.toString());
                    return user ? {
                        userId: participantId,
                        name: user.stravaProfile?.firstname && user.stravaProfile?.lastname 
                            ? `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`
                            : user.username,
                        username: user.username,
                        stravaProfile: user.stravaProfile
                    } : null;
                } catch (error) {
                    logger.error('Error fetching user details for participant', 'getContestParticipants', { participantId, error });
                    return null;
                }
            })
        );

        return participants.filter(p => p !== null);
    }

    /**
     * Add multiple participants to individual contest
     */
    async addMultipleParticipantsToContest(contestId: ObjectId, participantIds: ObjectId[]): Promise<{
        successful: ObjectId[];
        failed: { participantId: ObjectId; reason: string; }[];
    }> {
        logger.info('Starting bulk participant addition to contest', 'addMultipleParticipantsToContest', { 
            contestId, 
            participantCount: participantIds.length 
        });

        const result = {
            successful: [] as ObjectId[],
            failed: [] as { participantId: ObjectId; reason: string; }[]
        };

        // Validate contest exists and is individual type
        const contest = await this.getContest(contestId);
        if (!contest) {
            throw new Error('Contest not found');
        }

        if (contest.contestType !== 'Individual') {
            throw new Error('Can only add participants to individual contests');
        }

        // Check if contest has started
        if (this.hasContestStarted(contest)) {
            throw new Error('Cannot add participants after contest has started');
        }

        // Process each participant
        for (const participantId of participantIds) {
            try {
                const success = await contestData.addParticipant(contestId, participantId);
                if (success) {
                    result.successful.push(participantId);
                    logger.debug('Successfully added participant to contest', 'addMultipleParticipantsToContest', { 
                        contestId, 
                        participantId 
                    });
                } else {
                    result.failed.push({
                        participantId,
                        reason: 'Participant may already exist in contest'
                    });
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                logger.error('Failed to add participant to contest', 'addMultipleParticipantsToContest', { 
                    contestId, 
                    participantId, 
                    error: errorMessage 
                });
                result.failed.push({
                    participantId,
                    reason: errorMessage
                });
            }
        }

        logger.info('Completed bulk participant addition to contest', 'addMultipleParticipantsToContest', { 
            contestId, 
            successful: result.successful.length,
            failed: result.failed.length 
        });

        return result;
    }

    /**
     * Get available group members for participant selection (members not yet in contest)
     */
    async getAvailableGroupMembersForContest(contestId: ObjectId): Promise<any[]> {
        logger.info('Getting available group members for contest', 'getAvailableGroupMembersForContest', { contestId });

        const contest = await this.getContest(contestId);
        if (!contest) {
            throw new Error('Contest not found');
        }

        if (contest.contestType !== 'Individual') {
            throw new Error('Contest is not an individual contest');
        }

        // Get all group members (without pagination)
        const { groupMemberData } = await import('../data/group-member.data');
        const { members: groupMembers, total } = await groupMemberData.findByGroupId(contest.groupId.toString(), 1, 10000);

        // Get current participants
        const currentParticipantIds = new Set(contest.participantIds?.map(id => id.toString()) || []);

        // Filter out users who are already participants
        const availableMembers = [];
        for (const member of groupMembers) {
            if (!currentParticipantIds.has(member.userId.toString())) {
                try {
                    const user = await userData.findById(member.userId.toString());
                    if (user) {
                        availableMembers.push({
                            userId: member.userId,
                            name: user.stravaProfile?.firstname && user.stravaProfile?.lastname
                                ? `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`
                                : user.username,
                            username: user.username,
                            stravaProfile: user.stravaProfile
                        });
                    }
                } catch (error) {
                    logger.error('Error fetching user details for group member', 'getAvailableGroupMembersForContest', {
                        userId: member.userId,
                        error
                    });
                }
            }
        }

        logger.info('Retrieved available group members for contest', 'getAvailableGroupMembersForContest', {
            contestId,
            totalMembers: total,
            availableMembers: availableMembers.length
        });

        return availableMembers;
    }


    /**
     * Process team member activities for a user
     */
    async processTeamMemberActivities(userId: ObjectId, workoutActivity: any): Promise<void> {
        logger.info('Processing team member activities', 'processTeamMemberActivities', { userId, activityId: workoutActivity._id });
        
        // Get teams from database
        const teams = await teamData.findByMemberId(userId);
        if (teams.length === 0) {
            logger.info('No teams found for user, skipping team member activity creation', 'processTeamMemberActivities', { userId });
            return;
        }
        
        logger.debug('Teams found for user', 'processTeamMemberActivities', { userId, teamsCount: teams.length });
        
        // For each team, create a team member activity if the user is a member of an active contest
        for (const team of teams) {
            try {
                // Get the contest
                const contestId = team.contestId;
                const contest = await contestData.findById(contestId);
                
                if (!contest) {
                    logger.warn('Contest not found for team, skipping', 'processTeamMemberActivities', { contestId, teamId: team._id });
                    continue;
                }

                // Check if workout is within contest date range
                if (workoutActivity.startDate < contest.startAt || workoutActivity.startDate > contest.endAt) {
                    logger.debug('Team activity outside contest date range, skipping', 'processTeamMemberActivities', { 
                        activityId: workoutActivity._id, 
                        contestId, 
                        activityDate: workoutActivity.startDate.toISOString(), 
                        contestStart: contest.startAt.toISOString(), 
                        contestEnd: contest.endAt.toISOString() 
                    });
                    continue;
                }
                
                // Check activity type filter
                if (contest.activityType && contest.activityType !== 'All' && !this.isActivityTypeAllowed(workoutActivity.workoutType, contest.activityType)) {
                    continue;
                }
                
                // Check pace filter (skip if activity has no pace data)
                if (workoutActivity.pace !== null) {
                    if (contest.minPace && workoutActivity.pace < contest.minPace) {
                        continue;
                    }
                    
                    if (contest.maxPace && workoutActivity.pace > contest.maxPace) {
                        continue;
                    }
                }
                
                // Check minimum distance filter
                if (contest.minDistance && workoutActivity.distance < contest.minDistance) {
                    continue;
                }

                // Route validation:
                // - Contest không có route: cho qua như cũ.
                // - Contest có route: chỉ RunTracker/System activity có routePoints và đi đúng route mới được tính.
                const routeValidation = this.validateContestRouteIfNeeded(
                    contest,
                    workoutActivity
                );

                if (!routeValidation.shouldCount) {
                    logger.info(
                        'Team activity skipped because route validation failed',
                        'processTeamMemberActivities',
                        {
                            contestId: contest._id,
                            workoutActivityId: workoutActivity._id,
                            routeMatchResult: routeValidation.routeMatchResult,
                        }
                    );

                    continue;
                }

                // Gắn tạm kết quả vào workoutActivity để các bước xử lý sau có thể dùng nếu cần.
                workoutActivity.routeMatchResult = routeValidation.routeMatchResult;
                
                // Create team member activity
                const teamMemberActivity = await teamMemberActivityService.createFromWorkout(
                    workoutActivity,
                    team._id as ObjectId,
                    contestId
                );
                
                if (teamMemberActivity) {
                    logger.info('Created team member activity', 'processTeamMemberActivities', { teamId: team._id, contestId });
                }
            } catch (error) {
                logger.error('Error processing team', 'processTeamMemberActivities', { teamId: team._id, error });
                // Continue with other teams even if one fails
            }
        }
        
        logger.info('Finished processing team member activities', 'processTeamMemberActivities', { userId });
    }

    /**
     * Process individual contest activities for a user
     */
    async processIndividualContestActivities(userId: ObjectId, workoutActivity: any): Promise<void> {
        
        // Find all individual contests where this user is a participant
        const individualContests = await contestData.findByContestTypeAndParticipant('Individual', userId);
        
        if (individualContests.length === 0) {
            return;
        }
        
        for (const contest of individualContests) {
            try {
                // Check if workout is within contest date range
                if (workoutActivity.startDate < contest.startAt || workoutActivity.startDate > contest.endAt) {
                    continue;
                }
                
                // Check activity type filter
                if (contest.activityType && contest.activityType !== 'All' && !this.isActivityTypeAllowed(workoutActivity.workoutType, contest.activityType)) {
                    logger.debug('Activity type mismatch, skipping', 'processIndividualContestActivities', { 
                        activityId: workoutActivity._id, 
                        activityType: workoutActivity.workoutType, 
                        contestType: contest.activityType 
                    });
                    continue;
                }
                
                // Check pace filter (skip if activity has no pace data)
                if (workoutActivity.pace !== null) {
                    if (contest.minPace && workoutActivity.pace < contest.minPace) {
                        continue;
                    }
                    
                    if (contest.maxPace && workoutActivity.pace > contest.maxPace) {
                        continue;
                    }
                }
                
                // Check minimum distance filter
                if (contest.minDistance && workoutActivity.distance < contest.minDistance) {
                    continue;
                }

                // Route validation:
                // - Contest không có route: cho qua như cũ.
                // - Contest có route: chỉ RunTracker/System activity có routePoints và đi đúng route mới được tính.
                const routeValidation = this.validateContestRouteIfNeeded(
                    contest,
                    workoutActivity
                );

                if (!routeValidation.shouldCount) {
                    logger.info(
                        'Activity skipped because route validation failed',
                        'processIndividualContestActivities',
                        {
                            contestId: contest._id,
                            workoutActivityId: workoutActivity._id,
                            routeMatchResult: routeValidation.routeMatchResult,
                        }
                    );

                    continue;
                }
                
                // Check if individual contest activity already exists
                const existingActivity = await individualContestActivityData.findByOriginalWorkoutId(workoutActivity._id);
                if (existingActivity) {
                    continue;
                }
                
                // Create individual contest activity
                const individualActivity = {
                    userId: userId,
                    contestId: contest._id!,
                    stravaUserId: workoutActivity.stravaUserId,
                    distance: workoutActivity.distance,
                    movingTime: workoutActivity.movingTime,
                    workoutType: workoutActivity.workoutType,
                    pace: workoutActivity.pace,
                    startDate: workoutActivity.startDate,
                    workoutActivityId: workoutActivity._id,
                    stravaActivityId: workoutActivity.stravaActivityId,
                    routeMatchResult: routeValidation.routeMatchResult
                };
                
                const activityId = await individualContestActivityData.create(individualActivity);
                logger.info('Created individual contest activity', 'processIndividualContestActivities', { activityId, contestId: contest._id });
                
            } catch (error) {
                logger.error('Error processing individual contest', 'processIndividualContestActivities', { contestId: contest._id, error });
                // Continue with other contests even if one fails
            }
        }
        
        logger.info('Finished processing individual contest activities', 'processIndividualContestActivities', { userId });
    }

    /**
     * Clean up Redis cache for affected users after contest deletion
     */
    private async cleanupCacheForUsers(userIds: ObjectId[]): Promise<void> {
        try {
            for (const userId of userIds) {
                await this.updateUserTeamsCache(userId);
            }
        } catch (error) {
            logger.error('Error cleaning up Redis cache for users after contest deletion', 'cleanupUserCacheAfterContestDeletion', { userIds, error });
            // Don't throw error as cache cleanup is not critical
        }
    }

    /**
     * Check if an activity type is allowed for a contest
     * Run and Walk activities are allowed for both Run and Walk contest types
     */
    private isActivityTypeAllowed(activityType: string, contestActivityType: string): boolean {
        // Direct match
        if (activityType === contestActivityType) {
            return true;
        }
        
        // Run and Walk are interchangeable
        if ((activityType === 'Run' || activityType === 'Walk') && 
            (contestActivityType === 'Run' || contestActivityType === 'Walk')) {
            return true;
        }
        
        return false;
    }

    /**
     * Get all activities for a team in a contest with user details
     */
    async getTeamContestActivities(contestId: ObjectId, teamId: ObjectId, userId?: ObjectId): Promise<any[]> {
        const contest = await this.getContest(contestId);
        if (!contest) {
            throw new Error('Contest not found');
        }

        if (contest.contestType !== 'Team') {
            throw new Error('Contest is not a team contest');
        }

        const team = await this.getTeam(teamId);
        if (!team) {
            throw new Error('Team not found');
        }

        if (team.contestId.toString() !== contestId.toString()) {
            throw new Error('Team does not belong to this contest');
        }

        let activities;
        if (userId) {
            activities = await teamMemberActivityService.getUserTeamActivities(userId, teamId);
        } else {
            activities = await teamMemberActivityService.getTeamActivities(teamId);
        }
        
        // Populate user details
        return await Promise.all(activities.map(async (activity) => {
            try {
                const user = await userData.findById(activity.userId.toString());
                return {
                    ...activity,
                    userDetails: user ? {
                        name: user.stravaProfile?.firstname && user.stravaProfile?.lastname
                             ? `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`
                             : user.username,
                        username: user.username,
                        avatar: (user.stravaProfile as any)?.profile
                    } : null
                };
            } catch (error) {
                 return { ...activity, userDetails: null };
            }
        }));
    }

    // Fix the ensureConnected method to use isConnected
    private ensureConnected() {
        if (!contestData.isConnected()) {
            throw new Error('Database connection not established for Contests');
        }
        if (!teamData.isConnected()) {
            throw new Error('Database connection not established for Teams');
        }
    }
}

export const contestService = new ContestService();