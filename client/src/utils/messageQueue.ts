
interface QueuedMessage {
  id: string;
  content: string;
  chatId: string;
  timestamp: number;
  retryCount: number;
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;

  enqueue(message: Omit<QueuedMessage, 'retryCount'>) {
    this.queue.push({ ...message, retryCount: 0 });
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const message = this.queue[0];
      
      try {
        await this.sendMessage(message);
        this.queue.shift(); // Remove successful message
      } catch (error) {
        message.retryCount++;
        if (message.retryCount >= 3) {
          this.queue.shift(); // Remove failed message after 3 attempts
        } else {
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, message.retryCount) * 1000)
          );
        }
      }
    }
    
    this.processing = false;
  }

  private async sendMessage(message: QueuedMessage) {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message.content,
        chatId: message.chatId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  }

  getQueueLength() {
    return this.queue.length;
  }
}

export const messageQueue = new MessageQueue();
