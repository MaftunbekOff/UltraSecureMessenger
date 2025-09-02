
import { cache } from "../cache";

export class ProfileCache {
  private static PROFILE_TTL = 300; // 5 minutes
  private static STATUS_TTL = 60; // 1 minute
  private static ONLINE_STATUS_TTL = 30; // 30 seconds

  static async getUserProfile(userId: string) {
    const key = `profile:${userId}`;
    return await cache.get(key);
  }

  static async setUserProfile(userId: string, profile: any) {
    const key = `profile:${userId}`;
    await cache.set(key, profile, this.PROFILE_TTL);
  }

  static async invalidateUserProfile(userId: string) {
    const key = `profile:${userId}`;
    await cache.del(key);
  }

  static async getUserOnlineStatus(userId: string) {
    const key = `online:${userId}`;
    return await cache.get(key);
  }

  static async setUserOnlineStatus(userId: string, isOnline: boolean, lastSeen?: Date) {
    const key = `online:${userId}`;
    await cache.set(key, { isOnline, lastSeen }, this.ONLINE_STATUS_TTL);
  }

  static async getUserStatuses(userId: string) {
    const key = `statuses:${userId}`;
    return await cache.get(key);
  }

  static async setUserStatuses(userId: string, statuses: any[]) {
    const key = `statuses:${userId}`;
    await cache.set(key, statuses, this.STATUS_TTL);
  }

  static async invalidateUserStatuses(userId: string) {
    const key = `statuses:${userId}`;
    await cache.del(key);
  }

  static async getProfileCompletion(userId: string) {
    const key = `completion:${userId}`;
    return await cache.get(key);
  }

  static async setProfileCompletion(userId: string, score: number) {
    const key = `completion:${userId}`;
    await cache.set(key, score, this.PROFILE_TTL);
  }
}
