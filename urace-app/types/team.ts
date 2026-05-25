export interface ITeamStat {
  teamId: string;
  teamName: string;
  contestId: string;
  stats: IDetailStat;
  ranking: IDetailRank;
}

interface IDetailStat {
  totalDistance: number;
  averagePace: number;
  totalTracklog: number;
  fatestPace: number;
  maxDistance: number;
  totalActivities: number;
  memberCount: number;
}

interface IDetailRank {
  totalDistance: number;
  averagePace: number;
  totalTracklog: number;
}

export interface ITeamLeaderboard {
  cachedAt?: string;
  contestId: string;
  metric: string;
  teams: IDetailTeamLeaderboard[];
}

interface IDetailTeamLeaderboard {
  averagePace: number;
  badge: string;
  fatestPace: number;
  maxDistance: number;
  memberCount: number;
  rank: number;
  teamId: string;
  teamName: string;
  totalActivities: number;
  totalDistance: number;
  totalTracklog: number;
}
