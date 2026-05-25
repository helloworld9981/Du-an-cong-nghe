import { IStravaProfile } from "./auth";

export interface IContest {
  _id: string;
  name: string;
  description?: string;
  contestType: string;
  activityType: string;
  startAt: Date;
  endAt: Date;
  numberOfParticipants: number;
  reminderMilestones?: number[];
}

export interface IDashboardContest {
  _id: string;
  name: string;
  description?: string;
  startAt: any;
  endAt: any;
  contestType: string;
  activityType: string;
  minPace?: number;
  maxPace?: number;
  minDistance?: number;
  groupId: string;
  createdBy?: string;
  numberOfTeams?: number;
  numberOfParticipants?: number;
  teamIds?: string[];
  participantIds?: string[];
}

export interface IContestParticipant {
  name: string;
  username: string;
  userId: string;
}

export interface IAvailableParticipant {
  userId: string;
  name: string;
  username: string;
}

export interface ITeamMember {
  userId: string;
  joinedAt: string;
  name: string;
  username: string;
}
export interface IContestTeam {
  _id: string;
  groupId: string;
  contestId: string;
  name: string;
  members: ITeamMember[];
  averagePace: number;
  totalDistance: number;
  totalTracklog: number;
  fastestPace: number;
  maxDistance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IContestTeamMemberLeaderboard {
  cachedAt?: string;
  contestId: string;
  teamFilter?: string;
  members: IMemberLeaderboard[];
}

interface IMemberLeaderboard {
  averagePace: number;
  bestPace: number;
  rank: number;
  stravaUserId: number;
  teamId: string;
  teamName: string;
  totalActivities: number;
  totalDistance: number;
  totalTracklog: number;
  userId: string;
  userName: string;
}

export interface IParticipantLeaderboard {
  averagePace: number;
  fastestPace: number;
  maxDistance: number;
  totalDistance: number;
  totalTracklog: number;
  userId: string;
  userDetails: ILeaderboardUserDetail;
}

interface ILeaderboardUserDetail {
  name: string;
  username: string;
  stravaProfile: IStravaProfile;
}
