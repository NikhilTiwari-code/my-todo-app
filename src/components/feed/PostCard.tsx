// src/components/feed/PostCard.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import PostImages from "./PostImages";
import PostComments from "./PostComments";
import LikeAnimation from "./LikeAnimation";
import HashtagText from "./HashtagText";

interface Post {
  _id: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  images: string[];
  caption?: string;
  location?: {
    name: string;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onDelete: (postId: string) => void;
  onLikeToggle: (postId: string, isLiked: boolean, likeCount: number) => void;
  onSaveToggle: (postId: string, isSaved: boolean) => void;
  onCommentAdded: (postId: string) => void;
}

export default function PostCard({
  post,
  currentUserId,
  onDelete,
  onLikeToggle,
  onSaveToggle,
  onCommentAdded,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const isOwnPost = post.userId._id === currentUserId;

  // Handle like
  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        onLikeToggle(post._id, data.isLiked, data.likeCount);
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  // Handle double-tap to like
  const handleDoubleTap = () => {
    if (!post.isLiked) {
      setShowLikeAnimation(true);
      handleLike();
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      const res = await fetch(`/api/posts/${post._id}/save`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        onSaveToggle(post._id, data.isSaved);
      }
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        onDelete(post._id);
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link
          href={`/profile/${post.userId._id}`}
          className="flex items-center gap-3"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            {post.userId.avatar ? (
              <Image
                src={post.userId.avatar}
                alt={post.userId.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-semibold">
                {post.userId.name[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{post.userId.username}</p>
            {post.location && (
              <p className="text-xs text-gray-500">{post.location.name}</p>
            )}
          </div>
        </Link>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {isOwnPost && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </button>
              )}
              <button
                onClick={() => setShowOptions(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="relative">
        <PostImages images={post.images} onDoubleTap={handleDoubleTap} />
        {showLikeAnimation && <LikeAnimation />}
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="hover:opacity-70 transition"
            >
              <Heart
                className={`w-6 h-6 ${
                  post.isLiked
                    ? "fill-red-500 text-red-500"
                    : "text-gray-800"
                }`}
              />
            </button>
            <button
              onClick={() => setShowComments(true)}
              className="hover:opacity-70 transition"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="hover:opacity-70 transition">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className="hover:opacity-70 transition"
          >
            <Bookmark
              className={`w-6 h-6 ${
                post.isSaved ? "fill-gray-800 text-gray-800" : "text-gray-800"
              }`}
            />
          </button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm mb-2">
          {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
        </p>

        {/* Caption */}
        {post.caption && (
          <div className="text-sm mb-2">
            <Link
              href={`/profile/${post.userId._id}`}
              className="font-semibold mr-2"
            >
              {post.userId.username}
            </Link>
            <HashtagText text={post.caption} />
          </div>
        )}

        {/* Comments Preview */}
        {post.commentCount > 0 && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            View all {post.commentCount} comments
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <PostComments
          postId={post._id}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => onCommentAdded(post._id)}
        />
      )}
    </div>
  );
}