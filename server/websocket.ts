
import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { storage } from './storage';

export function setupWebSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : false,
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      // Validate token and get user
      socket.data.userId = token; // Replace with proper token validation
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    
    // Join user to their personal room
    socket.join(`user:${userId}`);
    
    // Join user to their chat rooms
    socket.on('join-chats', async (chatIds: string[]) => {
      for (const chatId of chatIds) {
        const isMember = await storage.isChatMember(chatId, userId);
        if (isMember) {
          socket.join(`chat:${chatId}`);
        }
      }
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const message = await storage.createMessage({
          ...data,
          senderId: userId,
        });
        
        // Broadcast to chat room
        io.to(`chat:${data.chatId}`).emit('new-message', message);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user-typing', { userId, chatId });
    });

    socket.on('typing-stop', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user-stop-typing', { userId, chatId });
    });

    // Update online status
    storage.updateUserOnlineStatus(userId, true);
    
    socket.on('disconnect', () => {
      storage.updateUserOnlineStatus(userId, false);
    });
  });

  return io;
}
