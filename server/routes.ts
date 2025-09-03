import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupEmailAuth, isAuthenticated } from "./emailAuth";
import { performanceMonitor, trackAPIPerformance } from "./performanceMonitor";
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
  await setupEmailAuth(app);

  // Performance tracking middleware
  app.use(trackAPIPerformance);

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
      console.log(`👤 [Server] Foydalanuvchi olingan: ${userId}`);
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
      console.log(`✏️ [Server] Foydalanuvchi profili yangilanish so'rovi: ${userId}`, profileData);

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
      console.log(`✅ [Server] Foydalanuvchi profili muvaffaqiyatli yangilandi: ${userId}`);
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
      console.log(`🔍 [Server] Foydalanuvchi profili so'rovi: ${userId} (ko'ruvchi: ${viewerId})`);

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
      console.log(`🖼️ [Server] Avatar yuklash so'rovi: ${userId}`);

      if (!req.file) {
        console.error('❌ [Server] Avatar yuklashda xatolik - fayl yuklanmagan');
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith('image/')) {
        console.error('❌ [Server] Avatar yuklashda xatolik - rasm turi emas:', req.file.mimetype);
        return res.status(400).json({ message: "Only image files are allowed" });
      }

      const fileUrl = `/api/files/${req.file.filename}`;

      // Update user profile with new avatar
      await storage.updateUserProfile(userId, {
        profileImageUrl: fileUrl,
      });
      console.log(`✅ [Server] Avatar muvaffaqiyatli yuklandi va profil yangilandi: ${userId}, URL: ${fileUrl}`);

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
      console.log(`⚡ [Server] Foydalanuvchi statusini yaratish so'rovi: ${userId}`, statusData);

      const status = await storage.createUserStatus(userId, statusData);
      console.log(`✅ [Server] Foydalanuvchi statusi muvaffaqiyatli yaratildi: ${userId}`);
      res.json(status);
    } catch (error) {
      console.error("Error creating status:", error);
      res.status(500).json({ message: "Failed to create status" });
    }
  });

  app.get('/api/users/:userId/statuses', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      console.log(`🕒 [Server] Foydalanuvchi statuslarini so'rash: ${userId}`);
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
      console.log(`➕ [Server] Kontakt qo'shish so'rovi: ${userId} -> ${contactId} (nick: ${nickname})`);

      const contact = await storage.addUserContact(userId, contactId, nickname);
      console.log(`✅ [Server] Kontakt muvaffaqiyatli qo'shildi: ${userId} <-> ${contactId}`);
      res.json(contact);
    } catch (error) {
      console.error("Error adding contact:", error);
      res.status(500).json({ message: "Failed to add contact" });
    }
  });

  app.get('/api/users/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log(`📚 [Server] Kontaktlarni so'rash: ${userId}`);
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
      console.log(`➖ [Server] Kontaktni o'chirish so'rovi: ${userId} <-> ${contactId}`);

      await storage.removeUserContact(userId, contactId);
      console.log(`✅ [Server] Kontakt muvaffaqiyatli o'chirildi: ${userId} <-> ${contactId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing contact:", error);
      res.status(500).json({ message: "Failed to remove contact" });
    }
  });

  app.patch('/api/users/contacts/:contactId/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactId } = req.params;
      const { isFavorite } = req.body;
      console.log(`⭐ [Server] Kontaktni favorit holatini o'zgartirish: ${userId} <-> ${contactId}, favorit: ${isFavorite}`);

      await storage.updateContactFavorite(userId, contactId, isFavorite);
      console.log(`✅ [Server] Kontakt favorit holati yangilandi: ${userId} <-> ${contactId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating favorite:", error);
      res.status(500).json({ message: "Failed to update favorite" });
    }
  });

  app.post('/api/users/contacts/:contactId/block', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactId } = req.params;
      console.log(`🚫 [Server] Kontaktni bloklash so'rovi: ${userId} -> ${contactId}`);

      await storage.blockUserContact(userId, contactId);
      console.log(`✅ [Server] Kontakt bloklandi: ${userId} -> ${contactId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error blocking contact:", error);
      res.status(500).json({ message: "Failed to block contact" });
    }
  });

  app.post('/api/users/contacts/:contactId/unblock', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactId } = req.params;
      console.log(`🔓 [Server] Kontaktni blokdan chiqarish so'rovi: ${userId} -> ${contactId}`);

      await storage.unblockUserContact(userId, contactId);
      console.log(`✅ [Server] Kontakt blokdan chiqarildi: ${userId} -> ${contactId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unblocking contact:", error);
      res.status(500).json({ message: "Failed to unblock contact" });
    }
  });

  app.get('/api/users/contacts/mutual/:contactId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactId } = req.params;
      console.log(`🤝 [Server] O'zaro kontaktlarni so'rash: ${userId} <-> ${contactId}`);

      const mutualContacts = await storage.getMutualContacts(userId, contactId);
      res.json(mutualContacts);
    } catch (error) {
      console.error("Error fetching mutual contacts:", error);
      res.status(500).json({ message: "Failed to fetch mutual contacts" });
    }
  });

  app.patch('/api/users/online-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isOnline } = req.body;
      console.log(`💻 [Server] Foydalanuvchi onlayn holatini yangilash: ${userId}, onlayn: ${isOnline}`);

      await storage.updateUserOnlineStatus(userId, isOnline);
      console.log(`✅ [Server] Foydalanuvchi onlayn holati yangilandi: ${userId}`);
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
      console.log(`🔍 [Server] Foydalanuvchilarni qidirish: ${userId}, so'rov: ${query}`);

      if (!query) {
        return res.json([]);
      }

      const users = await storage.searchUsers(query, userId);
      console.log(`✅ [Server] Qidiruv natijalari topildi: ${users.length} foydalanuvchi`);
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
      console.log(`💬 [Server] Foydalanuvchi chatlarini so'rash: ${userId}`);
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Create a new chat (group/channel/DM)
  app.post("/api/chats", isAuthenticated, async (req: any, res) => {
    console.log('📨 [Server] Chat yaratish so\'rovi keldi:', req.body);
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChatSchema.parse(req.body);

      const chat = await storage.createChat({
        ...validatedData,
        createdBy: userId,
      });
      console.log('💾 [Server] Chat bazaga saqlandi:', chat);

      // Automatically add creator as admin member
      await storage.addChatMember({
        chatId: chat.id,
        userId: userId,
        isAdmin: true,
      });
      console.log('👥 [Server] Chat yaratuvchisi admin sifatida qo\'shildi:', userId);

      console.log('✅ [Server] Chat muvaffaqiyatli yaratildi va javob yuborildi');
      res.json(chat);
    } catch (error) {
      console.error('🚨 [Server] Chat yaratishda server xatoligi:', error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get('/api/chats/:chatId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chatId } = req.params;
      console.log(`ℹ️ [Server] Chat ma'lumotlarini so'rash: ${chatId} (foydalanuvchi: ${userId})`);

      // Check if user is member of chat
      const isMember = await storage.isChatMember(chatId, userId);
      if (!isMember) {
        console.warn(`🚫 [Server] Chatga kirish rad etildi (a'zo emas): ${chatId}, foydalanuvchi: ${userId}`);
        return res.status(403).json({ message: "Access denied" });
      }

      const chat = await storage.getChatWithMembers(chatId);
      if (!chat) {
        console.error(`❌ [Server] Chat topilmadi: ${chatId}`);
        return res.status(404).json({ message: "Chat not found" });
      }
      console.log(`✅ [Server] Chat ma'lumotlari topildi: ${chatId}`);
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
      console.log(`👤 [Server] Shaxsiy chat yaratish so'rovi: ${userId} <-> ${otherUserId}`);

      if (!otherUserId) {
        console.error('❌ [Server] Shaxsiy chat yaratishda xatolik - otherUserId kiritilmagan');
        return res.status(400).json({ message: "Other user ID is required" });
      }

      // Check if direct chat already exists
      const userChats = await storage.getUserChats(userId);
      const existingDirectChat = userChats.find(chat => 
        !chat.isGroup && chat.otherUser?.id === otherUserId
      );

      if (existingDirectChat) {
        console.log(`ℹ️ [Server] Shaxsiy chat allaqachon mavjud: ${existingDirectChat.id}`);
        return res.json(existingDirectChat);
      }

      // Create new direct chat
      const chat = await storage.createChat({
        isGroup: false,
        createdBy: userId,
      });
      console.log(`💬 [Server] Yangi shaxsiy chat yaratildi: ${chat.id}`);

      // Add other user as member
      await storage.addChatMember({
        chatId: chat.id,
        userId: otherUserId,
        isAdmin: false,
      });
      console.log(`👥 [Server] Ikkinchi foydalanuvchi a'zo sifatida qo'shildi: ${otherUserId} ga chat ${chat.id}`);

      console.log(`✅ [Server] Shaxsiy chat muvaffaqiyatli yaratildi: ${chat.id}`);
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
      console.log(`➕ [Server] Chat a'zosi qo'shish so'rovi: chat ${chatId}, a'zo: ${validatedData.userId}`);

      // Check if user is admin of chat
      const members = await storage.getChatMembers(chatId);
      const userMember = members.find(m => m.userId === userId);
      if (!userMember?.isAdmin) {
        console.warn(`🚫 [Server] Chat a'zosi qo'shish rad etildi (admin emas): chat ${chatId}, foydalanuvchi: ${userId}`);
        return res.status(403).json({ message: "Admin access required" });
      }

      const member = await storage.addChatMember({
        ...validatedData,
        chatId,
      });
      console.log(`✅ [Server] Chat a'zosi muvaffaqiyatli qo'shildi: chat ${chatId}, a'zo: ${validatedData.userId}`);
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
      console.log(`➖ [Server] Chat a'zosini o'chirish so'rovi: chat ${chatId}, a'zo: ${memberId} (boshqaruvchi: ${userId})`);

      // Check if user is admin or removing themselves
      const members = await storage.getChatMembers(chatId);
      const userMember = members.find(m => m.userId === userId);
      if (!userMember?.isAdmin && memberId !== userId) {
        console.warn(`🚫 [Server] Chat a'zosini o'chirish rad etildi (admin emas va o'zini o'chirayotgani yo'q): chat ${chatId}, foydalanuvchi: ${userId}, o'chirilayotgan: ${memberId}`);
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.removeChatMember(chatId, memberId);
      console.log(`✅ [Server] Chat a'zosi muvaffaqiyatli o'chirildi: chat ${chatId}, a'zo: ${memberId}`);
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
      console.log(`📜 [Server] Chat xabarlarini so'rash: chat ${chatId}, limit: ${limit}, offset: ${offset}`);

      // Check if user is member of chat
      const isMember = await storage.isChatMember(chatId, userId);
      if (!isMember) {
        console.warn(`🚫 [Server] Chat xabarlarini olish rad etildi (a'zo emas): chat ${chatId}, foydalanuvchi: ${userId}`);
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getChatMessages(chatId, limit, offset);
      console.log(`✅ [Server] Chat xabarlari olindi: chat ${chatId}, ${messages.length} ta xabar`);
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
      console.log(`✉️ [Server] Xabar yuborish so'rovi: chat ${chatId}, yuboruvchi: ${userId}`);

      // Check if user is member of chat
      const isMember = await storage.isChatMember(chatId, userId);
      if (!isMember) {
        console.warn(`🚫 [Server] Xabar yuborish rad etildi (a'zo emas): chat ${chatId}, foydalanuvchi: ${userId}`);
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertMessageSchema.parse(req.body);

      const message = await storage.createMessage({
        ...validatedData,
        chatId,
        senderId: userId,
      });
      console.log(`✅ [Server] Xabar muvaffaqiyatli yuborildi: chat ${chatId}, xabar ID: ${message.id}`);
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
      console.log(`✏️ [Server] Xabarni yangilash so'rovi: xabar ${messageId}, yangi mazmun: ${content}`);

      // Check if user owns the message
      const message = await storage.getMessageById(messageId);
      if (!message || message.senderId !== userId) {
        console.warn(`🚫 [Server] Xabarni yangilash rad etildi (mualliflik huquqi yo'q): xabar ${messageId}, foydalanuvchi: ${userId}`);
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedMessage = await storage.updateMessage(messageId, content);
      console.log(`✅ [Server] Xabar muvaffaqiyatli yangilandi: xabar ${messageId}`);
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
      console.log(`🗑️ [Server] Xabarni o'chirish so'rovi: xabar ${messageId}, foydalanuvchi: ${userId}`);

      // Check if user owns the message
      const message = await storage.getMessageById(messageId);
      if (!message || message.senderId !== userId) {
        console.warn(`🚫 [Server] Xabarni o'chirish rad etildi (mualliflik huquqi yo'q): xabar ${messageId}, foydalanuvchi: ${userId}`);
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteMessage(messageId);
      console.log(`✅ [Server] Xabar muvaffaqiyatli o'chirildi: xabar ${messageId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // File upload route
  app.post('/api/upload', isAuthenticated, upload.single('file'), (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log(`🚀 [Server] Fayl yuklash so'rovi: ${userId}`);
      if (!req.file) {
        console.error('❌ [Server] Fayl yuklashda xatolik - fayl yuklanmagan');
        return res.status(400).json({ message: "No file uploaded" });
      }
      console.log(`✅ [Server] Fayl muvaffaqiyatli yuklandi: ${req.file.originalname}`);
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
    console.log(`📥 [Server] Faylni yetkazib berish so'rovi: ${filename}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ [Server] Fayl topilmadi: ${filename}`);
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
      console.log(`👍 [Server] Xabarga reaksiya qo'shish so'rovi: xabar ${messageId}, foydalanuvchi: ${userId}, reaksiya: ${validatedData.emoji}`);

      const reaction = await storage.addMessageReaction({
        ...validatedData,
        messageId,
        userId,
      });
      console.log(`✅ [Server] Reaksiya muvaffaqiyatli qo'shildi: xabar ${messageId}, foydalanuvchi: ${userId}, reaksiya: ${validatedData.emoji}`);
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
      const decodedEmoji = decodeURIComponent(emoji);
      console.log(`👎 [Server] Xabardan reaksiya o'chirish so'rovi: xabar ${messageId}, foydalanuvchi: ${userId}, reaksiya: ${decodedEmoji}`);

      await storage.removeMessageReaction(messageId, userId, decodedEmoji);
      console.log(`✅ [Server] Reaksiya muvaffaqiyatli o'chirildi: xabar ${messageId}, foydalanuvchi: ${userId}, reaksiya: ${decodedEmoji}`);
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
      console.log(`👀 [Server] Chatni o'qilgan deb belgilash so'rovi: chat ${chatId}, foydalanuvchi: ${userId}`);

      // Check if user is member of chat
      const isMember = await storage.isChatMember(chatId, userId);
      if (!isMember) {
        console.warn(`🚫 [Server] Chatni o'qilgan deb belgilash rad etildi (a'zo emas): chat ${chatId}, foydalanuvchi: ${userId}`);
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.markChatAsRead(chatId, userId);
      console.log(`✅ [Server] Chat o'qilgan deb belgilandi: chat ${chatId}, foydalanuvchi: ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking chat as read:", error);
      res.status(500).json({ message: "Failed to mark chat as read" });
    }
  });

  // Performance monitoring routes
  app.get('/api/performance/metrics', async (req, res) => {
    try {
      console.log('📊 [Server] Tizim metrikalarini so'rash');
      const metrics = performanceMonitor.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.post('/api/performance/track', async (req, res) => {
    try {
      const { type, value, metadata } = req.body;
      console.log(`📈 [Server] Metrika yozib olish: type=${type}, value=${value}, metadata=${JSON.stringify(metadata)}`);
      performanceMonitor.recordMetric(type, value, metadata);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording metric:", error);
      res.status(500).json({ message: "Failed to record metric" });
    }
  });

  app.post('/api/performance/simulate/:condition', async (req, res) => {
    try {
      const { condition } = req.params;
      console.log(`🌐 [Server] Tarmoq sharoitini simulyatsiya qilish: ${condition}`);
      if (!['slow', 'fast', 'unstable'].includes(condition)) {
        console.error(`❌ [Server] Tarmoq sharoitini simulyatsiya qilishda xatolik - nomalum sharoit: ${condition}`);
        return res.status(400).json({ message: "Invalid network condition" });
      }
      res.json({ message: `Simulating ${condition} network conditions` });
    } catch (error) {
      console.error("Error simulating network:", error);
      res.status(500).json({ message: "Failed to simulate network" });
    }
  });

  app.post('/api/performance/load-test', async (req, res) => {
    try {
      const { messagesPerSecond, durationSeconds } = req.body;
      console.log(`💣 [Server] Yuklash testini boshlash: ${messagesPerSecond} MPS, ${durationSeconds}s davomida`);

      // Run load test in background
      performanceMonitor.simulateLoad(messagesPerSecond, durationSeconds);

      res.json({ 
        message: `Started load test: ${messagesPerSecond} MPS for ${durationSeconds}s` 
      });
    } catch (error) {
      console.error("Error starting load test:", error);
      res.status(500).json({ message: "Failed to start load test" });
    }
  });

  // Handle 404 for API routes
  app.use('/api/*', (req, res) => {
    console.log(`❌ [Server] API route topilmadi: ${req.method} ${req.path}`);
    res.status(404).json({ message: "API endpoint not found" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
}