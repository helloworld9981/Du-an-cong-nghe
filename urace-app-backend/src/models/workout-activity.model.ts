import { ObjectId } from "mongodb";

export interface WorkoutActivity {
  _id?: ObjectId;

  userId: ObjectId;

  stravaUserId?: number;

  distance: number;

  movingTime: number;

  workoutType: string;

  pace: number | null;

  startDate: Date;

  createdAt?: Date;

  updatedAt?: Date;

  stravaActivityId?: number;

  startLatLng?: [number, number] | null;

  endLatLng?: [number, number] | null;

  elevationGain?: number;

  elevHigh?: number;

  elevLow?: number;

  splitsMetric?: any[];

  recordType?: RecordTypes;

  mapPolyline?: string;

  routePoints?: {
    latitude: number;
    longitude: number;
    timestamp?: number;
    accuracy?: number;
  }[];

  routeMatchResult?: {
  isMatched: boolean;
  matchPercent: number;
  matchedCheckpoints: number;
  totalCheckpoints: number;
  missedCheckpoints: number[];
};

  contestId?: ObjectId;
}

export enum RecordTypes {
  Strava,
  System,
  HealthConnect = "HealthConnect",

}