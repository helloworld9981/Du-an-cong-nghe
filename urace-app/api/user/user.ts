import API from "../api";

export function GetMe() {
  return API.get("/api/user/profile");
}

export function SearchUser(search: string) {
  return API.get(`api/users/search?query=${search}`);
}

export function UpdateProfile(data: any) {
  return API.put("api/user/profile", data);
}

export function GetUserById(userId: string) {
  return API.get(`api/users/${userId}`);
}

export function SyncUserStravaData() {
  return API.post(`api/user/sync-strava`);
}

export function SyncUserHealthConnectData(data: any) {
  return API.post("/api/user/sync-health-connect", data);
}

export function GetUserActivities() {
  return API.get(`api/user/activities`);
}

export function CreateSystemActivity(data: any) {
  return API.post(`api/user/activities/system`, data);
}

export function GetLoginStreak() {
  return API.get("api/user/login-streak");
}
