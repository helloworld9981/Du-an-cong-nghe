export interface IActivity {
  _id: string;
  userId: string;
  stravaUserId: number;
  name: string;
  distance: number;
  movingTime: number;
  workoutType: string;
  pace: number;
  startDate: string;
  stravaActivityId: number;
  totalElevationGain?: number;
  elevLow?: number;
  elevHigh?: number;
  splitsMetric?: any[];
  createdAt?: string;
  updatedAt?: string;
  // Rejection fields
  isRejected?: boolean;
  rejectReason?: string;
  isFraud?: boolean;
  rejectedAt?: string;
  rejectedBy?: string;
  workoutActivityId?: string;
  recordType?: number;
}
