
export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  async showNotification(title: string, options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
  } = {}) {
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }

    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        ...options,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-192.png',
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.data?.chatId) {
          window.location.href = `/chat/${options.data.chatId}`;
        }
      };

      return notification;
    }
  }

  async showNewMessageNotification(sender: string, message: string, chatId: string) {
    return this.showNotification(`${sender}dan yangi xabar`, {
      body: message,
      tag: `message-${chatId}`,
      data: { chatId, type: 'message' },
      actions: [
        { action: 'reply', title: 'Javob berish' },
        { action: 'mark-read', title: 'O\'qilgan deb belgilash' }
      ]
    });
  }

  async showReactionNotification(sender: string, emoji: string, messageText: string) {
    return this.showNotification(`${sender} reaksiya qo'shdi`, {
      body: `${emoji} "${messageText.substring(0, 50)}..."`,
      tag: 'reaction',
      data: { type: 'reaction' }
    });
  }

  async showFriendRequestNotification(sender: string) {
    return this.showNotification('Yangi do\'st so\'rovi', {
      body: `${sender} sizga do'st so'rovi yubordi`,
      tag: 'friend-request',
      data: { type: 'friend-request', sender }
    });
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();
