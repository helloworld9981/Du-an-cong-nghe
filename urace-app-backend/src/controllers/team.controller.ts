import { Response } from 'express';
import { ObjectId } from 'mongodb';
import { AuthRequest } from '../middleware/auth.middleware';
import { teamData } from '../data/team.data';
import { userData } from '../data/user.data';
import { teamMemberActivityData } from '../data/team-member-activity.data';
import { TeamMemberActivityService } from '../services/team-member-activity.service';
import { TeamMember } from '../models/team.model';

const teamMemberActivityService = new TeamMemberActivityService();

/**
 * Populate team member details with user information
 */
const populateTeamMemberDetails = async (members: TeamMember[]): Promise<any[]> => {
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
        console.error('Error fetching user details for member:', member.userId, error);
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
};

export const getTeamDetail = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const teamId = new ObjectId(req.params.id);
    const team = await teamData.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Populate member details with user information
    const membersWithDetails = await populateTeamMemberDetails(team.members);
    
    // Return team with populated member details
    res.json({
      ...team,
      members: membersWithDetails
    });
  } catch (error) {
    console.error('Get team detail error:', error);
    res.status(500).json({ message: 'Internal server error while fetching team details' });
  }
};

export const getTeamMemberActivities = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const teamId = new ObjectId(req.params.teamId);
    const userId = new ObjectId(req.params.userId);
    
    // Verify team exists
    const team = await teamData.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all activities for this user in this team
    const activities = await teamMemberActivityData.findByTeamAndUser(teamId, userId);
    
    res.json(activities);
  } catch (error) {
    console.error('Get team member activities error:', error);
    res.status(500).json({ message: 'Internal server error while fetching member activities' });
  }
};

 