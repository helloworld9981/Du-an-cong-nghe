import API from "../api";

export function AddMultipleMembersToTeam(teamId: string, data: any) {
  return API.post(`api/teams/${teamId}/members/bulk`, data);
}

export function GetDetailTeam(teamId: string) {
  return API.get(`api/teams/${teamId}`);
}

export function GetDetailTeamStats(teamId: string) {
  return API.get(`api/teams/${teamId}/stats`);
}

export function RemoveMemberFromTeam(teamId: string = "", userId: string) {
  return API.delete(`api/teams/${teamId}/members/${userId}`);
}

export function GetMemberActivities(teamId: string = "", userId: string) {
  return API.get(`api/teams/${teamId}/members/${userId}/activities`);
}
