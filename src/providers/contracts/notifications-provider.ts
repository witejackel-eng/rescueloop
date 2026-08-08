// Provider contract: Notification delivery.

export interface SendNotificationParams {
  experienceId: string;
  title: string;
  content: string;
  userIds: string[];
  restPath?: string | null;
}

export interface NotificationResult {
  accepted: boolean; // API accepted the notification (NOT confirmed delivery)
  providerMessageId: string | null;
}

export interface NotificationsProvider {
  send(params: SendNotificationParams): Promise<NotificationResult>;
}
