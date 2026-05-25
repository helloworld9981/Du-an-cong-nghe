import { INotification } from "@/types/notification";
import API from "../api";

export const GetNotifications = () => {
  return API.get<INotification[]>("/api/notifications");
};

export const MarkNotificationAsRead = (id: string) => {
  return API.put(`/api/notifications/${id}/read`);
};

export const MarkAllNotificationsAsRead = () => {
  return API.put(`/api/notifications/read-all`);
};
