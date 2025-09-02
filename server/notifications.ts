
import webpush from 'web-push';

export class NotificationService {
  constructor() {
    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }

  async sendNotification(
    subscription: webpush.PushSubscription,
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: any;
    }
  ) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async notifyNewMessage(userId: string, message: any) {
    // Get user's push subscriptions and send notifications
    const payload = {
      title: `New message from ${message.sender.displayName}`,
      body: message.content,
      icon: '/icon-192.png',
      data: { chatId: message.chatId }
    };

    // Implementation depends on how you store subscriptions
  }
}
