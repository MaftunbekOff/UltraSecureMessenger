import {
  users,
  chats,
  chatMembers,
  messages,
  messageReactions,
  messageReads,
  userBadges,
  userStatuses,
  userContacts,
  profileViews,
  type User,
  type UpsertUser,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type ChatMember,
  type InsertChatMember,
  type MessageReaction,
  type InsertMessageReaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql, asc, isNull, ne, inArray } from "drizzle-orm";

// Define ChatWithExtras interface for clarity
interface ChatWithExtras extends Chat {
  lastMessage: Message | null;
  unreadCount: number;
  otherUser?: User;
  members: (ChatMember & { user: User })[];
}

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  searchUsers(query: string, excludeUserId: string): Promise<User[]>;
  updateUserProfile(userId: string, profileData: Partial<UpsertUser>): Promise<User>;
  getUserProfile(userId: string, viewerId?: string): Promise<User & { badges: any[], isContact: boolean, mutualContacts: number }>;
  createUserStatus(userId: string, statusData: any): Promise<any>;
  getUserStatuses(userId: string): Promise<any[]>;
  addUserContact(userId: string, contactId: string, nickname?: string): Promise<any>;
  getUserContacts(userId: string): Promise<(User & { nickname?: string; isFavorite: boolean })[]>;
  removeUserContact(userId: string, contactId: string): Promise<void>;


  // Chat operations
  createChat(chat: InsertChat & { createdBy: string }): Promise<Chat>;
  getUserChats(userId: string): Promise<ChatWithExtras[]>;
  getChatById(chatId: string): Promise<Chat | undefined>;
  getChatWithMembers(chatId: string): Promise<(Chat & { members: (ChatMember & { user: User })[] }) | undefined>;

  // Chat member operations
  addChatMember(member: InsertChatMember): Promise<ChatMember>;
  removeChatMember(chatId: string, userId: string): Promise<void>;
  getChatMembers(chatId: string): Promise<(ChatMember & { user: User })[]>;
  isChatMember(chatId: string, userId: string): Promise<boolean>;

  // Message operations
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  getChatMessages(chatId: string, limit?: number, offset?: number): Promise<(Message & { sender: User; replyTo?: Message })[]>;
  getMessageById(messageId: string): Promise<Message | undefined>;
  updateMessage(messageId: string, content: string): Promise<Message | undefined>;
  deleteMessage(messageId: string): Promise<void>;

  // Message reaction operations
  addMessageReaction(reaction: InsertMessageReaction & { userId: string }): Promise<MessageReaction>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  getMessageReactions(messageId: string): Promise<(MessageReaction & { user: User })[]>;

  // Message read operations
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  markChatAsRead(chatId: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.email,
          set: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            displayName: userData.displayName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      // If still error, try to find existing user by email
      if (error.code === '23505' && userData.email) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email));

        if (existingUser) {
          return existingUser;
        }
      }
      throw error;
    }
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        isOnline,
        lastSeen: isOnline ? undefined : new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, profileData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserProfile(userId: string, viewerId?: string): Promise<User & { badges: any[], isContact: boolean, mutualContacts: number }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) throw new Error("User not found");

    // Get user badges
    const badges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    // Check if viewer is a contact
    let isContact = false;
    let mutualContacts = 0;

    if (viewerId && viewerId !== userId) {
      const [contact] = await db
        .select()
        .from(userContacts)
        .where(and(
          eq(userContacts.userId, viewerId),
          eq(userContacts.contactId, userId),
          eq(userContacts.isBlocked, false)
        ));
      isContact = !!contact;

      // Count mutual contacts
      const mutualContactsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userContacts)
        .innerJoin(
          userContacts as any,
          and(
            eq(userContacts.contactId, sql`${userContacts}.contact_id`),
            eq(userContacts.userId, viewerId),
            eq(sql`${userContacts}.user_id`, userId)
          )
        )
        .where(and(
          eq(userContacts.isBlocked, false),
          eq(sql`${userContacts}.is_blocked`, false)
        ));

      mutualContacts = mutualContactsResult[0]?.count || 0;

      // Track profile view
      await db
        .insert(profileViews)
        .values({
          profileUserId: userId,
          viewerId: viewerId,
        })
        .onConflictDoNothing();
    }

    return {
      ...user,
      badges,
      isContact,
      mutualContacts,
    };
  }

  async createUserStatus(userId: string, statusData: any): Promise<any> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const [status] = await db
      .insert(userStatuses)
      .values({
        ...statusData,
        userId,
        expiresAt,
      })
      .returning();

    return status;
  }

  async getUserStatuses(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(userStatuses)
      .where(and(
        eq(userStatuses.userId, userId),
        sql`${userStatuses.expiresAt} > NOW()`
      ))
      .orderBy(desc(userStatuses.createdAt));
  }

  async addUserContact(userId: string, contactId: string, nickname?: string): Promise<any> {
    const [contact] = await db
      .insert(userContacts)
      .values({
        userId,
        contactId,
        nickname,
      })
      .returning();

    return contact;
  }

  async getUserContacts(userId: string): Promise<(User & { nickname?: string; isFavorite: boolean })[]> {
    const contacts = await db
      .select({
        contact: userContacts,
        user: users,
      })
      .from(userContacts)
      .innerJoin(users, eq(userContacts.contactId, users.id))
      .where(and(
        eq(userContacts.userId, userId),
        eq(userContacts.isBlocked, false)
      ))
      .orderBy(asc(users.displayName));

    return contacts.map(({ contact, user }) => ({
      ...user,
      nickname: contact.nickname,
      isFavorite: contact.isFavorite,
    }));
  }

  async removeUserContact(userId: string, contactId: string): Promise<void> {
    await db
      .delete(userContacts)
      .where(and(
        eq(userContacts.userId, userId),
        eq(userContacts.contactId, contactId)
      ));
  }

  async updateContactFavorite(userId: string, contactId: string, isFavorite: boolean): Promise<void> {
    await db
      .update(userContacts)
      .set({ isFavorite })
      .where(and(
        eq(userContacts.userId, userId),
        eq(userContacts.contactId, contactId)
      ));
  }

  async blockUserContact(userId: string, contactId: string): Promise<void> {
    await db
      .update(userContacts)
      .set({ isBlocked: true })
      .where(and(
        eq(userContacts.userId, userId),
        eq(userContacts.contactId, contactId)
      ));
  }

  async unblockUserContact(userId: string, contactId: string): Promise<void> {
    await db
      .update(userContacts)
      .set({ isBlocked: false })
      .where(and(
        eq(userContacts.userId, userId),
        eq(userContacts.contactId, contactId)
      ));
  }

  async getMutualContacts(userId: string, contactId: string): Promise<User[]> {
    const userContactsQuery = db
      .select({ contactId: userContacts.contactId })
      .from(userContacts)
      .where(and(
        eq(userContacts.userId, userId),
        eq(userContacts.isBlocked, false)
      ));

    const contactContactsQuery = db
      .select({ contactId: userContacts.contactId })
      .from(userContacts)
      .where(and(
        eq(userContacts.userId, contactId),
        eq(userContacts.isBlocked, false)
      ));

    const mutualContactIds = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        inArray(users.id, userContactsQuery),
        inArray(users.id, contactContactsQuery)
      ));

    return await db
      .select()
      .from(users)
      .where(inArray(users.id, mutualContactIds.map(c => c.id)));
  }

  async searchUsers(query: string, excludeUserId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          like(users.username, `%${query}%`),
          sql`${users.id} != ${excludeUserId}`
        )
      )
      .limit(10);
  }

  // Chat operations
  async createChat(chatData: InsertChat & { createdBy: string }): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values(chatData)
      .returning();

    // Add creator as admin member
    await this.addChatMember({
      chatId: chat.id,
      userId: chatData.createdBy,
      isAdmin: true,
    });

    return chat;
  }

  async getUserChats(userId: string): Promise<ChatWithExtras[]> {
    const chatsWithMembers = await db
      .select({
        id: chats.id,
        name: chats.name,
        description: chats.description,
        isGroup: chats.isGroup,
        avatarUrl: chats.avatarUrl,
        createdBy: chats.createdBy,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        member: {
          id: chatMembers.id,
          isAdmin: chatMembers.isAdmin,
          joinedAt: chatMembers.joinedAt,
        },
        otherUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          profileImageUrl: users.profileImageUrl,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
        },
      })
      .from(chats)
      .innerJoin(chatMembers, eq(chatMembers.chatId, chats.id))
      .leftJoin(
        users,
        and(
          eq(users.id, chatMembers.userId),
          ne(chatMembers.userId, userId),
          eq(chats.isGroup, false)
        )
      )
      .where(eq(chatMembers.userId, userId))
      .orderBy(desc(chats.updatedAt));

    // Group by chat and get latest message for each
    const chatMap = new Map<string, any>();

    for (const row of chatsWithMembers) {
      if (!chatMap.has(row.id)) {
        chatMap.set(row.id, {
          ...row,
          members: [],
        });
      }
    }

    // Get latest messages for all chats
    const chatIds = Array.from(chatMap.keys());
    if (chatIds.length === 0) return [];

    const latestMessages = await db
      .select({
        chatId: messages.chatId,
        id: messages.id,
        content: messages.content,
        messageType: messages.messageType,
        fileUrl: messages.fileUrl,
        fileName: messages.fileName,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: users.displayName,
        senderFirstName: users.firstName,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.senderId))
      .where(
        and(
          inArray(messages.chatId, chatIds),
          eq(messages.isDeleted, false)
        )
      )
      .orderBy(desc(messages.createdAt));

    // Group messages by chatId and get the latest one
    const messageMap = new Map<string, any>();
    for (const msg of latestMessages) {
      if (!messageMap.has(msg.chatId)) {
        messageMap.set(msg.chatId, msg);
      }
    }

    // Get unread count for each chat
    const unreadCounts = await db
      .select({
        chatId: messages.chatId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(messages)
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, userId)
        )
      )
      .where(
        and(
          inArray(messages.chatId, chatIds),
          eq(messages.isDeleted, false),
          isNull(messageReads.id),
          ne(messages.senderId, userId)
        )
      )
      .groupBy(messages.chatId);

    const unreadMap = new Map<string, number>();
    for (const unread of unreadCounts) {
      unreadMap.set(unread.chatId, unread.count);
    }

    // Combine all data
    const result: ChatWithExtras[] = Array.from(chatMap.values()).map((chat) => ({
      ...chat,
      lastMessage: messageMap.get(chat.id) || null,
      unreadCount: unreadMap.get(chat.id) || 0,
    }));

    return result;
  }

  async getChatById(chatId: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    return chat;
  }

  async getChatWithMembers(chatId: string): Promise<(Chat & { members: (ChatMember & { user: User })[] }) | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat) return undefined;

    const members = await db
      .select({
        member: chatMembers,
        user: users,
      })
      .from(chatMembers)
      .innerJoin(users, eq(chatMembers.userId, users.id))
      .where(eq(chatMembers.chatId, chatId));

    return {
      ...chat,
      members: members.map(({ member, user }) => ({ ...member, user })),
    };
  }

  // Chat member operations
  async addChatMember(member: InsertChatMember): Promise<ChatMember> {
    const [chatMember] = await db
      .insert(chatMembers)
      .values(member)
      .returning();
    return chatMember;
  }

  async removeChatMember(chatId: string, userId: string): Promise<void> {
    await db
      .delete(chatMembers)
      .where(and(
        eq(chatMembers.chatId, chatId),
        eq(chatMembers.userId, userId)
      ));
  }

  async getChatMembers(chatId: string): Promise<(ChatMember & { user: User })[]> {
    const members = await db
      .select({
        member: chatMembers,
        user: users,
      })
      .from(chatMembers)
      .innerJoin(users, eq(chatMembers.userId, users.id))
      .where(eq(chatMembers.chatId, chatId));

    return members.map(({ member, user }) => ({ ...member, user }));
  }

  async isChatMember(chatId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(chatMembers)
      .where(and(
        eq(chatMembers.chatId, chatId),
        eq(chatMembers.userId, userId)
      ));
    return !!member;
  }

  // Message operations
  async createMessage(messageData: InsertMessage & { senderId: string }): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();

    // Update chat's updatedAt
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, messageData.chatId));

    return message;
  }

  async getChatMessages(chatId: string, limit = 50, offset = 0): Promise<(Message & { sender: User; replyTo?: Message })[]> {
    const messagesData = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.chatId, chatId), eq(messages.isDeleted, false)))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const messagesWithReplies = [];

    for (const { message, sender } of messagesData) {
      let replyTo: Message | undefined;
      if (message.replyToId) {
        const [replyMessage] = await db
          .select()
          .from(messages)
          .where(eq(messages.id, message.replyToId));
        replyTo = replyMessage;
      }

      messagesWithReplies.push({
        ...message,
        sender,
        replyTo,
      });
    }

    return messagesWithReplies.reverse(); // Return in ascending order
  }

  async getMessageById(messageId: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
    return message;
  }

  async updateMessage(messageId: string, content: string): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({
        content,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();
    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));
  }

  // Message reaction operations
  async addMessageReaction(reactionData: InsertMessageReaction & { userId: string }): Promise<MessageReaction> {
    // Remove existing reaction with same emoji from same user
    await this.removeMessageReaction(reactionData.messageId, reactionData.userId, reactionData.emoji);

    const [reaction] = await db
      .insert(messageReactions)
      .values(reactionData)
      .returning();
    return reaction;
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      ));
  }

  async getMessageReactions(messageId: string): Promise<(MessageReaction & { user: User })[]> {
    const reactions = await db
      .select({
        reaction: messageReactions,
        user: users,
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.messageId, messageId));

    return reactions.map(({ reaction, user }) => ({ ...reaction, user }));
  }

  // Message read operations
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await db
      .insert(messageReads)
      .values({
        messageId,
        userId,
      })
      .onConflictDoNothing();
  }

  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(messageReads, and(
        eq(messageReads.messageId, messages.id),
        eq(messageReads.userId, userId)
      ))
      .where(and(
        eq(messages.chatId, chatId),
        eq(messages.isDeleted, false),
        sql`${messageReads.id} IS NULL`,
        sql`${messages.senderId} != ${userId}`
      ));

    for (const message of unreadMessages) {
      await this.markMessageAsRead(message.id, userId);
    }
  }
}

export const storage = new DatabaseStorage();