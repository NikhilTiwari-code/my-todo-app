// 📍 PASTE YOUR REEL GRID COMPONENT HERE
// Grid view for profile page

"use client";

import { useState } from "react";
import { Play, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";

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

interface ReelGridProps {
  reels: Reel[];
  isLoading?: boolean;
}

export function ReelGrid({ reels, isLoading = false }: ReelGridProps) {
  const [hoveredReel, setHoveredReel] = useState<string | null>(null);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[9/16] bg-gray-200 animate-pulse rounded-sm"
          />
        ))}
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reels yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {reels.map((reel) => (
        <Link
          key={reel._id}
          href={`/reels/${reel._id}`}
          className="relative aspect-[9/16] group cursor-pointer overflow-hidden rounded-sm"
          onMouseEnter={() => setHoveredReel(reel._id)}
          onMouseLeave={() => setHoveredReel(null)}
        >
          {/* Thumbnail */}
          <img
            src={reel.thumbnailUrl}
            alt={reel.caption}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />

          {/* Overlay on hover */}
          {hoveredReel === reel._id && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play className="w-12 h-12 text-white" fill="white" />
            </div>
          )}

          {/* Stats overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{formatCount(reel.likesCount)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{formatCount(reel.commentsCount)}</span>
                </div>
              </div>
              <div className="text-xs opacity-80">
                {reel.duration.toFixed(0)}s
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
