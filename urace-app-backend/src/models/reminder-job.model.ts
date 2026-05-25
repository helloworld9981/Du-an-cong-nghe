export interface ReminderJob {
  contestId: string;
  contestName: string;
  userId: string;
  milestone: number;
  minDistance: number;
  startAt: string;
  endAt: string;
}
