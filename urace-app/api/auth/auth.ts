import {
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
} from "@/types/auth";
import API from "../api";

export function Register(data: RegisterRequest) {
  return API.post("/api/register", data);
}

export function Login(data: LoginRequest) {
  return API.post("api/login", data);
}

export function ForgotPassword(data: ForgotPasswordRequest) {
  return API.post("api/forgot-password", data);
}

export function ChangePasswordAPI(data: any) {
  return API.put("api/change-password", data);
}

export function InitConnectToStrava(redirectUri: string) {
  return API.get(`/api/connect/strava?redirectUri=${encodeURIComponent(redirectUri)}`);
}
