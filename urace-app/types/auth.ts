export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export interface IUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  bio?: string;
  height?: number;
  weight?: number;
  stravaId?: string;
  stravaProfile?: IStravaProfile;
  createdAt?: string;
  updatedAt?: string;
}

export interface IStravaProfile {
  id: string;
  username?: string;
  firstname?: string;
  lastname?: string;
}
