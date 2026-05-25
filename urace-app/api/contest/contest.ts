import API from "../api";

export function CreateContest(data: any) {
  return API.post("/api/contests", data);
}

export function GetAllContests() {
  return API.get("/api/contests");
}

export function GetContest(contestId: string) {
  return API.get(`/api/contests/${contestId}`);
}

export function GetContestParticipants(contestId: string) {
  return API.get(`api/contests/${contestId}/participants`);
}

export function UpdateContest(contestId: string, data: any) {
  return API.put(`api/contests/${contestId}`, data);
}

export function GetAvailableContestParticipant(contestId: string) {
  return API.get(`api/contests/${contestId}/available-participants`);
}

export function AddParticipantsToContest(contestId: string, data: any) {
  return API.post(`api/contests/${contestId}/participants/bulk`, data);
}

export function GetTeamsForContest(contestId: string) {
  return API.get(`api/contests/${contestId}/teams`);
}

export function CreateTeam(contestId: string, data: any) {
  return API.post(`api/contests/${contestId}/teams`, data);
}

export function GetTeamLeaderboard(contestId: string, metric: string) {
  return API.get(`api/contests/${contestId}/team-leaderboard?metric=${metric}`);
}

export function GetTeamMemberLeaderboard(contestId: string, teamId?: string) {
  if (teamId) {
    return API.get(
      `api/contests/${contestId}/team-member-leaderboard?teamId=${teamId}`,
    );
  }
  return API.get(`api/contests/${contestId}/team-member-leaderboard`);
}

export function GetParticipantLeaderboard(contestId: string) {
  return API.get(`api/contests/${contestId}/leaderboard`);
}

export function GetIndividualContestActivities(
  contestId: string,
  userId: string,
) {
  return API.get(`api/contests/${contestId}/users/${userId}/activities`);
}

export function GetTeamContestActivities(
  contestId: string,
  teamId: string,
  userId?: string,
) {
  let url = `api/contests/${contestId}/teams/${teamId}/activities`;
  if (userId) {
    url += `?userId=${userId}`;
  }
  return API.get(url);
}

export function RejectActivity(
  contestId: string,
  activityId: string,
  data: { reason?: string; type?: "individual" | "team" },
) {
  return API.post(
    `api/contests/${contestId}/activities/${activityId}/reject`,
    data,
  );
}

export function RestoreActivity(
  contestId: string,
  activityId: string,
  data: any,
) {
  return API.post(
    `api/contests/${contestId}/activities/${activityId}/restore`,
    data,
  );
}

export function GetRejectedActivities(contestId: string) {
  return API.get(`api/contests/${contestId}/rejected-activities`);
}
