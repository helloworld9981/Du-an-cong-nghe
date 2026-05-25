export type CreateGroupRequest = {
  name: string;
  description: string;
  isPrivate: boolean;
  createdBy: string;
};

export interface IGroup {
  myGroups: IGroupDetail[];
  otherGroups: IGroupDetail[];
}

export interface IGroupDetail {
  _id: string;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  name: string;
  stats: IGroupStat;
  createdAt: Date;
  createdBy: string;
}

export interface IGroupStat {
  activeContestCount: number;
  activityLevel: string;
  totalContestCount: number;
  upcomingContestCount: number;
}
