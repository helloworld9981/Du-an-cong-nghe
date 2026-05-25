import { ObjectId } from 'mongodb';

export interface TeamMember {
    userId: ObjectId;
    joinedAt: Date;
}

export interface Team {
    _id?: ObjectId;
    groupId: ObjectId;
    contestId: ObjectId;
    name: string;
    numberOfMember: number;
    members: TeamMember[];
    averagePace: number;
    totalDistance: number;
    totalTracklog: number;
    fastestPace: number;
    maxDistance: number;
    createdAt?: Date;
    updatedAt?: Date;
}