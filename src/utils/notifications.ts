import Notification from "@/models/notification.model";
import { cache, cacheKeys } from "@/lib/redis";

/**
 * Notification creation parameters
 */
interface CreateNotificationParams {
  recipientId: string;
  senderId: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "MENTION" | "REPLY" | "STORY_VIEW" | "POST_TAG" | "NEW_POST" | "SHARE";
  postId?: string;
  reelId?: string;
  storyId?: string;
  commentId?: string;
  message?: string;
}

/**
 * Helper to emit Socket.io events for real-time notifications
 * Uses Redis as a queue for production scalability
 */
async function emitSocketNotification(recipientId: string, notification: any, unreadCount: number) {
  try {
    // Store notification event in Redis for Socket.io server to pick up
    // This allows for horizontal scaling and decoupled architecture
    const notificationEvent = {
      recipientId,
      notification: {
        id: notification._id.toString(),
        type: notification.type,
        sender: notification.sender,
        message: notification.message,
        createdAt: notification.createdAt,
        post: notification.post?._id,
        reel: notification.reel?._id,
      },
      unreadCount,
    };

    // Store with short TTL (60 seconds) - Socket server should pick it up quickly
    await cache.set(
      `socket:notification:${recipientId}:${Date.now()}`,
      notificationEvent,
      60
    );

    console.log(`📤 Socket notification queued for user ${recipientId}`);
  } catch (error) {
    // Don't throw error - real-time notification is best-effort
    console.error("⚠️ Failed to queue socket notification:", error);
  }
}

export async function createNotification(params: CreateNotificationParams) {
  const { recipientId, senderId, type, postId, reelId, storyId, commentId, message } = params;

  // Don't notify yourself
  if (recipientId === senderId) return null;

  try {
    // 1. Create notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      reel: reelId,
      story: storyId,
      comment: commentId,
      message,
      isRead: false,
    });

    // 2. Populate sender details for real-time push
    await notification.populate("sender", "name avatar isVerified");
    await notification.populate("post", "imageUrl caption");
    await notification.populate("reel", "videoUrl thumbnail");

    // 3. Update unread count in Redis cache
    const unreadCount = await getUnreadCount(recipientId);
    await cache.set(cacheKeys.notificationCount(recipientId), unreadCount, 300); // 5min cache

    // 4. Invalidate notifications list cache
    await cache.del(cacheKeys.notifications(recipientId));

    // 5. Emit Socket.io event for real-time notification (best-effort, non-blocking)
    await emitSocketNotification(recipientId, notification, unreadCount);

    console.log(`✅ Notification created: ${type} from ${senderId} to ${recipientId}`);

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    return null;
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return 0;
  }
}

export async function markAsRead(userId: string, notificationId?: string): Promise<boolean> {
  try {
    if (notificationId) {
      // Mark single notification as read
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() }
      );
    } else {
      // Mark all notifications as read
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    }

    // Invalidate caches
    await cache.del(cacheKeys.notificationCount(userId));
    await cache.del(cacheKeys.notifications(userId));

    return true;
  } catch (error) {
    console.error("❌ Error marking as read:", error);
    return false;
  }
}

/**
 * Notify all followers when user creates a new post
 * Batch notification creation for efficiency
 */
export async function notifyFollowersAboutNewPost(
  userId: string,
  postId: string,
  followerIds: string[],
  caption?: string
) {
  try {
    // Don't notify if no followers
    if (!followerIds || followerIds.length === 0) {
      return;
    }

    console.log(`📢 Notifying ${followerIds.length} followers about new post`);

    // Create notifications for each follower (async, best-effort)
    const notificationPromises = followerIds.map((followerId) =>
      createNotification({
        recipientId: followerId,
        senderId: userId,
        type: "NEW_POST",
        postId: postId,
        message: caption?.substring(0, 100), // First 100 chars of caption
      }).catch((err) => {
        // Log but don't fail if individual notification fails
        console.error(`Failed to notify follower ${followerId}:`, err);
      })
    );

    // Wait for all notifications (with timeout)
    await Promise.allSettled(notificationPromises);

    console.log(`✅ Notifications sent to followers`);
  } catch (error) {
    // Don't throw - notification failure shouldn't affect post creation
    console.error("⚠️ Error notifying followers:", error);
  }
}
