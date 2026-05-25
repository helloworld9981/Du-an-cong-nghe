export interface INotification {
  _id: string;
  title: string;
  message: string;
  type?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  userId: string;
}
