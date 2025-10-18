// 📍 PASTE YOUR REEL ACTIONS COMPONENT HERE
// Like/Comment/Share buttons

"use client";

import { Heart, MessageCircle, Share, Send } from "lucide-react";
import { useState } from "react";

interface ReelActionsProps {
  reelId: string;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  onLike: (reelId: string) => void;
  onComment: () => void; // Changed to just toggle comments
  onShare: (reelId: string) => void;
}

export function ReelActions({
  reelId,
  isLiked,
  likesCount,
  commentsCount,
  onLike,
  onComment,
  onShare,
}: ReelActionsProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = () => {
    setIsAnimating(true);
    onLike(reelId);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/reels/${reelId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this reel!",
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }

    onShare(reelId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log("Link copied to clipboard");
    });
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Like Button */}
      <button
        onClick={handleLike}
        className="flex flex-col items-center group"
      >
        <div className={`p-2 rounded-full transition-all duration-200 ${
          isLiked ? "scale-110" : "scale-100"
        }`}>
          <Heart
            className={`w-7 h-7 ${
              isLiked 
                ? "fill-red-500 text-red-500" 
                : "text-white group-hover:text-gray-300"
            } ${isAnimating ? "animate-ping" : ""}`}
          />
        </div>
        <span className="text-white text-xs font-semibold mt-1">
          {formatCount(likesCount)}
        </span>
      </button>

      {/* Comment Button */}
      <button
        onClick={onComment}
        className="flex flex-col items-center group"
      >
        <div className="p-2 rounded-full">
          <MessageCircle className="w-7 h-7 text-white group-hover:text-gray-300 transition-colors" />
        </div>
        <span className="text-white text-xs font-semibold mt-1">
          {formatCount(commentsCount)}
        </span>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex flex-col items-center group"
      >
        <div className="p-2 rounded-full">
          <Send className="w-7 h-7 text-white group-hover:text-gray-300 transition-colors" />
        </div>
        <span className="text-white text-xs font-semibold mt-1">
          Share
        </span>
      </button>

      {/* Three Dots Menu */}
      <button className="flex flex-col items-center group">
        <div className="p-2 rounded-full">
          <div className="flex flex-col items-center justify-center space-y-0.5">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
      </button>
    </div>
  );
}
