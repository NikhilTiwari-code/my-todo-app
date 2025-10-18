"use client";

import { useState } from "react";
import { Settings, Share2, UserPlus, UserMinus, MoreHorizontal, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface ProfileActionsProps {
  isOwner: boolean;
  userId: string;
  isFollowing?: boolean;
  onEditClick?: () => void;
  onShareClick?: () => void;
  onFollowSuccess?: () => void;
}

export function ProfileActions({
  isOwner,
  userId,
  isFollowing = false,
  onEditClick,
  onShareClick,
  onFollowSuccess,
}: ProfileActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);

  const handleFollow = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading(following ? "Unfollowing..." : "Following...");

    try {
      const res = await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setFollowing(!following);
        onFollowSuccess?.();
        toast.success(following ? "Unfollowed successfully" : "Followed successfully! 🎉", {
          id: loadingToast,
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Action failed", { id: loadingToast });
      }
    } catch (error) {
      console.error("Follow error:", error);
      toast.error("Failed to perform action", { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = () => {
    router.push(`/messages?userId=${userId}`);
  };

  const handleShare = () => {
    if (onShareClick) {
      onShareClick();
    } else {
      // Fallback: Copy link
      const url = `${window.location.origin}/profile/${userId}`;
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied! 🔗");
    }
  };

  if (isOwner) {
    return (
      <div className="flex items-center gap-3 px-4 md:px-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEditClick}
          className="flex-1 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Settings size={18} />
          Edit Profile
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors"
        >
          <Share2 size={18} />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 md:px-6">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleFollow}
        disabled={isLoading}
        className={`flex-1 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
          following
            ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
        }`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : following ? (
          <>
            <UserMinus size={18} />
            Following
          </>
        ) : (
          <>
            <UserPlus size={18} />
            Follow
          </>
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleMessage}
        className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
      >
        <MessageCircle size={18} />
        Message
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleShare}
        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors"
      >
        <Share2 size={18} />
      </motion.button>
    </div>
  );
}
