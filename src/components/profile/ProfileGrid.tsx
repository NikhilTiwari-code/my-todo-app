"use client";

import NextImage from "next/image";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Play } from "lucide-react";

type ContentType = "post" | "reel";

interface ContentItem {
  _id: string;
  type: ContentType;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  likes: string[];
  comments: number;
}

interface ProfileGridProps {
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
}

export function ProfileGrid({ items, onItemClick }: ProfileGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
            <span className="text-6xl">📸</span>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          When you share photos or videos, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {items.map((item, index) => (
        <motion.div
          key={item._id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          onClick={() => onItemClick(item)}
          className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-100 dark:bg-gray-800"
        >
          {/* Image/Video Thumbnail */}
          {item.type === "post" && item.imageUrl && (
            <NextImage
              src={item.imageUrl}
              alt={item.caption || "Post"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 33vw, 25vw"
              unoptimized
            />
          )}

          {item.type === "reel" && item.videoUrl && (
            <>
              <video
                src={item.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                loop
                playsInline
              />
              {/* Reel indicator */}
              <div className="absolute top-2 right-2 text-white z-10">
                <Play size={20} fill="white" />
              </div>
            </>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-6 text-white font-semibold">
              <div className="flex items-center gap-2">
                <Heart size={24} fill="white" />
                <span>{item.likes.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={24} fill="white" />
                <span>{item.comments}</span>
              </div>
            </div>
          </div>

          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.div>
      ))}
    </div>
  );
}
