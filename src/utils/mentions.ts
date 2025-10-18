/**
 * 🏷️ Mention Utilities
 * Extract and process @mentions from text
 */

import User from "@/models/user.models";
import { createNotification } from "./notifications";

/**
 * Extract @mentions from text
 * Returns array of usernames (without @)
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);
  
  if (!mentions) return [];
  
  // Remove @ and get unique usernames
  return [...new Set(mentions.map(m => m.substring(1).toLowerCase()))];
}

/**
 * Find users by their usernames and return their IDs
 */
export async function getUserIdsByUsernames(usernames: string[]): Promise<string[]> {
  if (!usernames || usernames.length === 0) return [];
  
  try {
    const users = await User.find({
      username: { $in: usernames }
    }).select('_id').lean();
    
    return users.map(u => u._id.toString());
  } catch (error) {
    console.error("Error finding users by username:", error);
    return [];
  }
}

/**
 * Notify mentioned users
 */
export async function notifyMentionedUsers(
  text: string,
  senderId: string,
  postId?: string,
  commentId?: string,
  reelId?: string,
  storyId?: string
) {
  try {
    // Extract mentions from text
    const usernames = extractMentions(text);
    
    if (usernames.length === 0) return;
    
    // Get user IDs from usernames
    const userIds = await getUserIdsByUsernames(usernames);
    
    if (userIds.length === 0) return;
    
    // Create notifications for each mentioned user
    const notificationPromises = userIds.map(userId =>
      createNotification({
        recipientId: userId,
        senderId,
        type: "MENTION",
        postId,
        commentId,
        reelId,
        storyId,
        message: text.substring(0, 100), // Preview
      }).catch(err => {
        console.error(`Failed to notify mentioned user ${userId}:`, err);
      })
    );
    
    await Promise.allSettled(notificationPromises);
    
    console.log(`✅ Notified ${userIds.length} mentioned users`);
  } catch (error) {
    console.error("Error notifying mentioned users:", error);
  }
}

/**
 * Convert @mentions to clickable links in text
 * For frontend rendering
 */
export function renderMentions(text: string): string {
  if (!text) return "";
  
  return text.replace(
    /@(\w+)/g,
    '<a href="/profile/$1" class="text-blue-600 hover:underline font-semibold">@$1</a>'
  );
}

/**
 * Get suggestions for @ autocomplete
 * Returns users matching the query
 */
export async function getMentionSuggestions(
  query: string,
  currentUserId: string,
  limit: number = 10
): Promise<Array<{ _id: string; username: string; name: string; avatar?: string }>> {
  if (!query || query.length < 1) {
    // Return user's followers/following for empty query
    try {
      const user = await User.findById(currentUserId)
        .populate('following', 'username name avatar')
        .lean();
      
      return (user?.following || []).slice(0, limit) as any;
    } catch (error) {
      return [];
    }
  }
  
  try {
    // Search for users matching the query
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username name avatar')
      .limit(limit)
      .lean();
    
    return users as any;
  } catch (error) {
    console.error("Error getting mention suggestions:", error);
    return [];
  }
}
