import { CreateGroupRequest } from "@/types/group";
import API from "../api";

export function CreateGroup(data: CreateGroupRequest) {
  return API.post("/api/groups", data);
}

export function GetAllGroups() {
  return API.get("/api/groups");
}

export function GetGroup(groupId: string) {
  return API.get(`api/groups/${groupId}`);
}

export function GetContestsInGroup(groupId: string) {
  return API.get(`api/groups/${groupId}/contests`);
}

export function GetGroupMembers(groupId: string, search?: string) {
  return API.get(`api/groups/${groupId}/members?search=${search ?? ""}`);
}

export function AddMemberToGroup(groupId: string, data: any) {
  return API.post(`api/groups/${groupId}/members`, data);
}

export function UpdateMemberRole(groupId: string, userId: string, data: any) {
  return API.put(`api/groups/${groupId}/members/${userId}/role`, data);
}

export function RequestToJoinGroup(groupId: string, data: any) {
  return API.post(`api/groups/${groupId}/join`, data);
}

export function GetUserJoinStatus(groupId: string) {
  return API.get(`api/groups/${groupId}/join-status`);
}

export function CancelRequestToJoin(groupId: string, data: any) {
  return API.delete(`api/groups/${groupId}/join`, data);
}

export function GetUserRoleInGroup(groupId: string) {
  return API.get(`api/groups/${groupId}/role`);
}

export function GetGroupPendingRequests(groupId: string) {
  return API.get(`api/groups/${groupId}/requests`);
}

export function AcceptPendingRequest(groupId: string, userId: string) {
  return API.post(`api/groups/${groupId}/requests/${userId}/approve`);
}

export function DeclinePendingRequest(groupId: string, userId: string) {
  return API.post(`api/groups/${groupId}/requests/${userId}/reject`);
}

export function DeleteGroup(groupId: string) {
  return API.delete(`api/groups/${groupId}`);
}

export function LeaveGroup(groupId: string) {
  return API.post(`/api/groups/${groupId}/leave`);
}

export function UpdateGroup(groupId: string, data: any) {
  return API.put(`api/groups/${groupId}`, data);
}
