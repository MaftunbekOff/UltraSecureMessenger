import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  displayName: varchar("display_name"),
  bio: text("bio"),
  statusMessage: varchar("status_message", { length: 100 }),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  presenceStatus: varchar("presence_status").default("online"), // online, away, busy, invisible
  isVerified: boolean("is_verified").default(false),
  phoneNumber: varchar("phone_number"),
  username: varchar("username").unique(),
  website: varchar("website"),
  location: varchar("location"),
  language: varchar("language").default("en"),
  timezone: varchar("timezone"),
  profileVisibility: varchar("profile_visibility").default("everyone"), // everyone, contacts, nobody
  lastSeenVisibility: varchar("last_seen_visibility").default("everyone"),
  phoneVisibility: varchar("phone_visibility").default("contacts"),
  emailVisibility: varchar("email_visibility").default("contacts"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  profileCompletionScore: integer("profile_completion_score").default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chats table for both direct and group chats
export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name"),
  description: text("description"),
  isGroup: boolean("is_group").default(false),
  avatarUrl: varchar("avatar_url"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat participants/members
export const chatMembers = pgTable("chat_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text("content"),
  messageType: varchar("message_type").default('text'), // text, image, file, audio, video
  fileUrl: varchar("file_url"),
  fileName: varchar("file_name"),
  fileSize: integer("file_size"),
  replyToId: varchar("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message reactions
export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  emoji: varchar("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message read receipts
export const messageReads = pgTable("message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  readAt: timestamp("read_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages),
  chatMembers: many(chatMembers),
  messageReactions: many(messageReactions),
  messageReads: many(messageReads),
  createdChats: many(chats),
  badges: many(userBadges),
  statuses: many(userStatuses),
  statusViews: many(statusViews, { relationName: "viewer" }),
  contacts: many(userContacts, { relationName: "user" }),
  contactOf: many(userContacts, { relationName: "contact" }),
  activities: many(userActivity),
  profileViews: many(profileViews, { relationName: "profile" }),
  viewedProfiles: many(profileViews, { relationName: "viewer" }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
}));

export const userStatusesRelations = relations(userStatuses, ({ one, many }) => ({
  user: one(users, {
    fields: [userStatuses.userId],
    references: [users.id],
  }),
  views: many(statusViews),
}));

export const statusViewsRelations = relations(statusViews, ({ one }) => ({
  status: one(userStatuses, {
    fields: [statusViews.statusId],
    references: [userStatuses.id],
  }),
  viewer: one(users, {
    fields: [statusViews.viewerId],
    references: [users.id],
    relationName: "viewer",
  }),
}));

export const userContactsRelations = relations(userContacts, ({ one }) => ({
  user: one(users, {
    fields: [userContacts.userId],
    references: [users.id],
    relationName: "user",
  }),
  contact: one(users, {
    fields: [userContacts.contactId],
    references: [users.id],
    relationName: "contact",
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));

export const profileViewsRelations = relations(profileViews, ({ one }) => ({
  profileUser: one(users, {
    fields: [profileViews.profileUserId],
    references: [users.id],
    relationName: "profile",
  }),
  viewer: one(users, {
    fields: [profileViews.viewerId],
    references: [users.id],
    relationName: "viewer",
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  creator: one(users, {
    fields: [chats.createdBy],
    references: [users.id],
  }),
  members: many(chatMembers),
  messages: many(messages),
}));

export const chatMembersRelations = relations(chatMembers, ({ one }) => ({
  chat: one(chats, {
    fields: [chatMembers.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [chatMembers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
  reactions: many(messageReactions),
  reads: many(messageReads),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}));

export const messageReadsRelations = relations(messageReads, ({ one }) => ({
  message: one(messages, {
    fields: [messageReads.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReads.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  displayName: true,
  bio: true,
  statusMessage: true,
  username: true,
  phoneNumber: true,
  website: true,
  location: true,
  language: true,
  timezone: true,
  profileVisibility: true,
  lastSeenVisibility: true,
  phoneVisibility: true,
  emailVisibility: true,
});

export const insertUserStatusSchema = createInsertSchema(userStatuses).pick({
  content: true,
  mediaUrl: true,
  mediaType: true,
  backgroundColor: true,
  textColor: true,
  expiresAt: true,
});

export const insertUserContactSchema = createInsertSchema(userContacts).pick({
  contactId: true,
  nickname: true,
  isFavorite: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  name: true,
  description: true,
  isGroup: true,
  avatarUrl: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  content: true,
  messageType: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  replyToId: true,
});

export const insertChatMemberSchema = createInsertSchema(chatMembers).pick({
  chatId: true,
  userId: true,
  isAdmin: true,
});

export const insertMessageReactionSchema = createInsertSchema(messageReactions).pick({
  messageId: true,
  emoji: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ChatMember = typeof chatMembers.$inferSelect;
export type InsertChatMember = z.infer<typeof insertChatMemberSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageRead = typeof messageReads.$inferSelect;
// User badges and verification
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeType: varchar("badge_type").notNull(), // verified, developer, premium, early_adopter
  issuedBy: varchar("issued_by"),
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// User status updates (stories)
export const userStatuses = pgTable("user_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text("content"),
  mediaUrl: varchar("media_url"),
  mediaType: varchar("media_type"), // image, video, text
  backgroundColor: varchar("background_color"),
  textColor: varchar("text_color"),
  expiresAt: timestamp("expires_at").notNull(),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Status views tracking
export const statusViews = pgTable("status_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  statusId: varchar("status_id").references(() => userStatuses.id, { onDelete: 'cascade' }).notNull(),
  viewerId: varchar("viewer_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// User contacts/friends
export const userContacts = pgTable("user_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  contactId: varchar("contact_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  nickname: varchar("nickname"),
  isFavorite: boolean("is_favorite").default(false),
  isBlocked: boolean("is_blocked").default(false),
  addedAt: timestamp("added_at").defaultNow(),
});

// User activity tracking
export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  activityType: varchar("activity_type").notNull(), // message_sent, profile_updated, status_posted
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Profile views tracking
export const profileViews = pgTable("profile_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileUserId: varchar("profile_user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  viewerId: varchar("viewer_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});
