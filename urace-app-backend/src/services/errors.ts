export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export const ErrorCodes = {
  CONTEST_NOT_FOUND: "CONTEST_NOT_FOUND",
  TEAM_NOT_FOUND: "TEAM_NOT_FOUND",
  CONTEST_ALREADY_STARTED: "CONTEST_ALREADY_STARTED",
  GROUP_NOT_FOUND: "GROUP_NOT_FOUND",
} as const;
