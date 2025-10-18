/**
 * Socket.io Event Emitter Utility
 * 
 * This module provides a safe way to emit Socket.io events from API routes.
 * Since Next.js API routes and Socket.io server may run in different processes,
 * we use a fallback mechanism for production.
 */

import { cache } from "@/lib/redis";

interface NotificationEventData {
  id: string;
  type: string;
  sender: any;
  message?: string;
  createdAt: Date;
  post?: string;
  reel?: string;
  story?: string;
}

/**
 * Emit notification event to a specific user
 * In production, this stores the event in Redis for the Socket.io server to pick up
 */
export async function emitNotification(userId: string, notification: NotificationEventData) {
  try {
    // For development/monolithic setup: direct socket emission
    // For production: use Redis pub/sub or HTTP callback
    
    // Store in Redis for the socket server to pick up
    const eventKey = `socket:event:notification:${userId}:${Date.now()}`;
    await cache.set(eventKey, notification, 60); // 1 minute TTL
    
    // Also store in a list for batch processing
    const listKey = `socket:events:${userId}`;
    await cache.set(listKey, notification, 300); // 5 minutes
    
    console.log(`📤 Socket event queued for user ${userId}:`, notification.type);
    
    return true;
  } catch (error) {
    console.error("❌ Failed to emit socket event:", error);
    return false;
  }
}

/**
 * Emit unread count update to a specific user
 */
export async function emitUnreadCount(userId: string, count: number) {
  try {
    const eventKey = `socket:event:count:${userId}:${Date.now()}`;
    await cache.set(eventKey, { count }, 60);
    
    console.log(`📤 Unread count queued for user ${userId}: ${count}`);
    
    return true;
  } catch (error) {
    console.error("❌ Failed to emit unread count:", error);
    return false;
  }
}

/**
 * For local development or when Socket.io is in the same process
 * This is a placeholder - in production you'd use Redis pub/sub or HTTP webhooks
 */
export function getSocketInstance() {
  // This would only work if Socket.io is in the same process
  // In a production setup with separate servers, use Redis pub/sub instead
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    try {
      // Dynamic import to avoid bundling issues
      return null; // Return null for now, use Redis-based approach
    } catch {
      return null;
    }
  }
  return null;
}
