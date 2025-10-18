"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { ShareModal } from "./ShareModal";

interface ShareButtonProps {
  postId?: string;
  reelId?: string;
  storyId?: string;
  shareCount?: number;
  variant?: "icon" | "button"; // Icon for posts, button for reels
}

export function ShareButton({
  postId,
  reelId,
  storyId,
  shareCount = 0,
  variant = "icon",
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localShareCount, setLocalShareCount] = useState(shareCount);

  const handleShareSuccess = () => {
    setLocalShareCount((prev) => prev + 1);
  };

  if (variant === "button") {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Send size={20} />
          <span className="text-sm font-medium">
            {localShareCount > 0 ? localShareCount : "Share"}
          </span>
        </button>

        {isModalOpen && (
          <ShareModal
            postId={postId}
            reelId={reelId}
            storyId={storyId}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleShareSuccess}
          />
        )}
      </>
    );
  }

  // Icon variant (for posts)
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        title="Share"
      >
        <Send size={24} />
        {localShareCount > 0 && (
          <span className="text-sm font-medium">{localShareCount}</span>
        )}
      </button>

      {isModalOpen && (
        <ShareModal
          postId={postId}
          reelId={reelId}
          storyId={storyId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleShareSuccess}
        />
      )}
    </>
  );
}
