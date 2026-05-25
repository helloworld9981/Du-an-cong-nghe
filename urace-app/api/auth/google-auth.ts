import API from "../api";

export const GoogleLogin = (idToken: string) => {
  return API.post("/api/auth/google", { idToken });
};