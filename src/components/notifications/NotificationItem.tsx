"use client";

import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, UserPlus, AtSign, Eye, Tag, Reply, ImagePlus, Send } from "lucide-react";
import { UserAvatar } from "../users/UserAvatar";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const ICONS = {
  LIKE: <Heart className="text-red-500" size={20} />,
  COMMENT: <MessageCircle className="text-blue-500" size={20} />,
  FOLLOW: <UserPlus className="text-green-500" size={20} />,
  MENTION: <AtSign className="text-purple-500" size={20} />,
  REPLY: <Reply className="text-indigo-500" size={20} />,
  STORY_VIEW: <Eye className="text-orange-500" size={20} />,
  POST_TAG: <Tag className="text-pink-500" size={20} />,
  NEW_POST: <ImagePlus className="text-cyan-500" size={20} />,
  SHARE: <Send className="text-purple-500" size={20} />,
};

const NOTIFICATION_TEXT = {
  LIKE: "liked your post",
  COMMENT: "commented on your post",
  FOLLOW: "started following you",
  MENTION: "mentioned you in a comment",
  REPLY: "replied to your comment",
  STORY_VIEW: "viewed your story",
  POST_TAG: "tagged you in a post",
  NEW_POST: "posted a new photo",
  SHARE: "shared a post with you",
};

interface NotificationItemProps {
  notification: any;
  onRead: () => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter();

  const handleClick = async () => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ notificationId: notification._id }),
        });
        onRead();
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }

    // Navigate to content
    if (notification.type === "FOLLOW") {
      // Navigate to user profile
      router.push(`/users/${notification.sender._id}`);
    } else if (notification.type === "SHARE") {
      // For SHARE notifications, navigate to the shared post
      if (notification.post) {
        router.push(`/feed?postId=${notification.post._id}`);
      } else if (notification.reel) {
        router.push(`/reels?id=${notification.reel._id}`);
      } else if (notification.story) {
        router.push(`/stories/${notification.sender._id}`);
      }
    } else if (notification.post) {
      router.push(`/feed?postId=${notification.post._id}`);
    } else if (notification.reel) {
      router.push(`/reels?id=${notification.reel._id}`);
    } else if (notification.story) {
      router.push(`/stories/${notification.sender._id}`);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors ${
        !notification.isRead ? "bg-blue-50 dark:bg-blue-900/10" : ""
      }`}
    >
      <div className="flex gap-3 items-start">
        {/* Avatar with Icon Badge */}
        <div className="relative flex-shrink-0">
          <UserAvatar
            name={notification.sender?.name || "User"}
            avatar={notification.sender?.avatar}
            size="sm"
          />
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
            {ICONS[notification.type as keyof typeof ICONS]}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            <span className="font-semibold">{notification.sender?.name}</span>{" "}
            <span className="text-gray-600 dark:text-gray-400">
              {NOTIFICATION_TEXT[notification.type as keyof typeof NOTIFICATION_TEXT]}
            </span>
          </p>
          
          {notification.message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
              &quot;{notification.message}&quot;
            </p>
          )}
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Post/Reel Thumbnail */}
        {(notification.post?.imageUrl || notification.reel?.thumbnail) && (
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={notification.post?.imageUrl || notification.reel?.thumbnail}
              alt="Content"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </motion.div>
  );
}
