export namespace Notification {
  export interface INotificationItem {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
  }

  export interface IGetNotificationsResponse {
    data: INotificationItem[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  }

  export interface ICommonResponse {
    message?: string;
    success?: boolean;
  }
}
