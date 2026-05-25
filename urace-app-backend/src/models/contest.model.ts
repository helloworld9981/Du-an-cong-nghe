import { ObjectId } from "mongodb";

export type ContestType = "Team" | "Individual";

export type ActivityType =
  | "Run"
  | "Walk"
  | "Swim"
  | "Ride"
  | "All";

export interface ContestRoutePoint {
  latitude: number;
  longitude: number;
  order: number;
  address?: string;
}

export interface ContestRoute {
  startPoint: ContestRoutePoint;

  endPoint: ContestRoutePoint;

  polyline: ContestRoutePoint[];

  checkpoints?: ContestRoutePoint[];

  distanceKm?: number;

  toleranceMeters?: number;

  requiredMatchPercent?: number;
}

export interface Contest {
  _id?: ObjectId;

  name: string;

  groupId: ObjectId;

  createdBy: ObjectId;

  startAt: Date;

  endAt: Date;

  numberOfParticipants: number;

  numberOfTeams: number;

  teamIds: ObjectId[];

  participantIds: ObjectId[];

  detail: string;

  contestType: ContestType;

  activityType: ActivityType;

  minPace?: number;

  maxPace?: number;

  minDistance?: number;

  reminderMilestones?: number[];

  route?: ContestRoute;

  createdAt?: Date;

  updatedAt?: Date;
}