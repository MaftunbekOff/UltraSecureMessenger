import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertChatSchema, insertMessageSchema, insertChatMemberSchema, insertMessageReactionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.patch('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = req.body;
      
      // Calculate completion score
      let completionScore = 0;
      if (profileData.displayName) completionScore += 15;
      if (profileData.bio) completionScore += 15;
      if (profileData.profileImageUrl) completionScore += 20;
      if (profileData.statusMessage) completionScore += 10;
      if (profileData.username) completionScore += 15;
      if (profileData.phoneNumber) completionScore += 10;
      if (profileData.website) completionScore += 10;
      if (profileData.location) completionScore += 5;
      
      const user = await storage.updateUserProfile(userId, {
        ...profileData,
        profileCompletionScore: completionScore,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/users/:userId/profile', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const viewerId = req.user.claims.sub;
      
      const profile = await storage.getUserProfile(userId, viewerId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Avatar upload route
  app.post('/api/upload/avatar', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "Only image files are allowed" });
      }
      
      const fileUrl = `/api/files/${req.file.filename}`;
      
      // Update user profile with new avatar
      await storage.updateUserProfile(userId, {
        profileImageUrl: fileUrl,
      });
      
      res.json({
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // User status routes
  app.post('/api/users/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statusData = req.body;
      
      const status = await storage.createUserStatus(userId, statusData);
      res.json(status);
    } catch (error) {
      console.error("Error creating status:", error);
      res.status(500).json({ message: "Failed to create status" });
    }
  });

  app.get('/api/users/:userId/statuses', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const statuses = await storage.getUserStatuses(userId);
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      res.status(500).json({ message: "Failed to fetch statuses" });
    }
  });

  // Contact management routes
  app.post('/api/users/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactId, nickname } = req.body;
      
      const contact = await storage.addUserContact(userId, contactId, nickname);
      res.json(contact);
    } catch (error) {
      console.error("Error adding contact:", error);
      res.status(500).json({ message: "Failed to add contact" });
    }
  });

  app.get('/api/users/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getUserContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.delete('/api/users/contacts/:contactId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactId } = req.params;
      
      await storage.removeUserContact(userId, contactId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing contact:", error);
      res.status(500).json({ message: "Failed to remove contact" });
    }
  });

  app.patch('/api/users/online-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isOnline } = req.body;
      
      await storage.updateUserOnlineStatus(userId, isOnline);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating online status:", error);
      res.status(500).json({ message: "Failed to update online status" });
    }
  });

  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const query = req.query.q as string;
      
      if (!query) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(query, userId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Chat routes
  app.get('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post('/api/chats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChatSchema.parse(req.body);
      
      const chat = await storage.createChat({
        ...validatedData,
        createdBy: userId,
      });
      
      res.json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get('/api/chats/:chatId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId } = req.params;
      
      // Check if user is member of chat
      const isMember = await storage.isChatMember(chatId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const chat = await storage.getChatWithMembers(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  // Direct chat creation
  app.post('/api/chats/direct', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "Other user ID is required" });
      }
      
      // Check if direct chat already exists
      const userChats = await storage.getUserChats(userId);
      const existingDirectChat = userChats.find(chat => 
        !chat.isGroup && chat.otherUser?.id === otherUserId
      );
      
      if (existingDirectChat) {
        return res.json(existingDirectChat);
      }
      
      // Create new direct chat
      const chat = await storage.createChat({
        isGroup: false,
        createdBy: userId,
      });
      
      // Add other user as member
      await storage.addChatMember({
        chatId: chat.id,
        userId: otherUserId,
        isAdmin: false,
      });
      
      res.json(chat);
    } catch (error) {
      console.error("Error creating direct chat:", error);
      res.status(500).json({ message: "Failed to create direct chat" });
    }
  });

  // Chat member routes
  app.post('/api/chats/:chatId/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId } = req.params;
      const validatedData = insertChatMemberSchema.parse(req.body);
      
      // Check if user is admin of chat
      const members = await storage.getChatMembers(chatId);
      const userMember = members.find(m => m.userId === userId);
      if (!userMember?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const member = await storage.addChatMember({
        ...validatedData,
        chatId,
      });
      
      res.json(member);
    } catch (error) {
      console.error("Error adding chat member:", error);
      res.status(500).json({ message: "Failed to add chat member" });
    }
  });

  app.delete('/api/chats/:chatId/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId, memberId } = req.params;
      
      // Check if user is admin or removing themselves
      const members = await storage.getChatMembers(chatId);
      const userMember = members.find(m => m.userId === userId);
      if (!userMember?.isAdmin && memberId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.removeChatMember(chatId, memberId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing chat member:", error);
      res.status(500).json({ message: "Failed to remove chat member" });
    }
  });

  // Message routes
  app.get('/api/chats/:chatId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Check if user is member of chat
      const isMember = await storage.isChatMember(chatId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await storage.getChatMessages(chatId, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/chats/:chatId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId } = req.params;
      
      // Check if user is member of chat
      const isMember = await storage.isChatMember(chatId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertMessageSchema.parse(req.body);
      
      const message = await storage.createMessage({
        ...validatedData,
        chatId,
        senderId: userId,
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch('/api/messages/:messageId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      const { content } = req.body;
      
      // Check if user owns the message
      const message = await storage.getMessageById(messageId);
      if (!message || message.senderId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedMessage = await storage.updateMessage(messageId, content);
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete('/api/messages/:messageId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      
      // Check if user owns the message
      const message = await storage.getMessageById(messageId);
      if (!message || message.senderId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteMessage(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // File upload route
  app.post('/api/upload', isAuthenticated, upload.single('file'), (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/api/files/${req.file.filename}`;
      res.json({
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Serve uploaded files
  app.get('/api/files/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    res.sendFile(filePath);
  });

  // Message reaction routes
  app.post('/api/messages/:messageId/reactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      const validatedData = insertMessageReactionSchema.parse(req.body);
      
      const reaction = await storage.addMessageReaction({
        ...validatedData,
        messageId,
        userId,
      });
      
      res.json(reaction);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  app.delete('/api/messages/:messageId/reactions/:emoji', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId, emoji } = req.params;
      
      await storage.removeMessageReaction(messageId, userId, decodeURIComponent(emoji));
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  // Mark messages as read
  app.post('/api/chats/:chatId/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId } = req.params;
      
      // Check if user is member of chat
      const isMember = await storage.isChatMember(chatId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.markChatAsRead(chatId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking chat as read:", error);
      res.status(500).json({ message: "Failed to mark chat as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
