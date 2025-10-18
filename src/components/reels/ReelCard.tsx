// 📍 PASTE YOUR REEL CARD COMPONENT HERE
// Single reel card with video player

"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { ReelPlayer } from "./ReelPlayer";
import { ReelActions } from "./ReelActions";
import { ReelComments } from "./ReelComments";

interface User {
  _id: string;
  name: string;
  avatar?: string;
  username?: string;
}

interface Reel {
  _id: string;
  user: User;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  views: number;
  likes: User[];
  likesCount: number;
  comments: any[];
  commentsCount: number;
  hashtags: string[];
  music?: string;
  isLiked: boolean;
  createdAt: string;
}

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  onLike: (reelId: string) => void;
  onComment: (reelId: string, text: string) => void;
  onShare: (reelId: string) => void;
  onDelete?: (reelId: string) => void;
  currentUserId?: string;
  onVideoEnd?: () => void;
  onVideoStart?: () => void;
}

export function ReelCard({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  onDelete,
  currentUserId,
  onVideoEnd,
  onVideoStart,
}: ReelCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const isOwner = currentUserId && currentUserId === reel.user._id;

  const handleLike = () => {
    onLike(reel._id);
  };

  const handleComment = (text: string) => {
    onComment(reel._id, text);
  };

  const handleShare = () => {
    onShare(reel._id);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    
    if (window.confirm("Delete this reel? This cannot be undone.")) {
      onDelete(reel._id);
      setShowOptions(false);
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video Player - Takes full height */}
      <div className="absolute inset-0">
        <ReelPlayer
          videoUrl={reel.videoUrl}
          thumbnailUrl={reel.thumbnailUrl}
          isActive={isActive}
          onVideoEnd={onVideoEnd}
          onVideoStart={onVideoStart}
        />
      </div>

      {/* User Info Overlay */}
      <div className="absolute top-4 left-4 right-16 flex items-center space-x-3">
        <img
          src={reel.user.avatar || "/default-avatar.png"}
          alt={reel.user.name}
          className="w-10 h-10 rounded-full border-2 border-white"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {reel.user.name}
          </p>
          <p className="text-white/70 text-xs truncate">
            @{reel.user.username}
          </p>
        </div>
        
        {/* Options Menu Button */}
        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {/* Options Dropdown */}
          {showOptions && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowOptions(false)}
              />
              
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl py-2 min-w-[180px] z-50">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/reels/${reel._id}`);
                    setShowOptions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  Copy Link
                </button>
                
                {isOwner && onDelete && (
                  <>
                    <div className="border-t my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Reel
                    </button>
                  </>
                )}
                
                {!isOwner && (
                  <>
                    <div className="border-t my-1" />
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        // Report feature coming soon
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Report
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Info Overlay - Bottom Left */}
      <div className="absolute bottom-20 left-4 right-20 z-10">
        {/* Caption */}
        <p className="text-white text-sm mb-2 line-clamp-2 drop-shadow-lg">
          {reel.caption}
        </p>

        {/* Hashtags */}
        {reel.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {reel.hashtags.slice(0, 3).map((hashtag) => (
              <span
                key={hashtag}
                className="text-blue-400 text-sm hover:underline cursor-pointer"
              >
                #{hashtag}
              </span>
            ))}
            {reel.hashtags.length > 3 && (
              <span className="text-white/70 text-sm">
                +{reel.hashtags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Music */}
        {reel.music && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            <span className="text-white/80 text-sm">{reel.music}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center space-x-4 text-white/80 text-sm">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{formatViews(reel.views)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Right Side (Instagram Style) */}
      <div className="absolute right-3 bottom-20 flex flex-col space-y-4 z-10">
        <ReelActions
          reelId={reel._id}
          isLiked={reel.isLiked}
          likesCount={reel.likesCount}
          commentsCount={reel.commentsCount}
          onLike={handleLike}
          onComment={() => setShowComments(true)}
          onShare={handleShare}
        />
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <ReelComments
          reelId={reel._id}
          comments={reel.comments}
          onClose={() => setShowComments(false)}
          onAddComment={handleComment}
        />
      )}
    </div>
  );
}
