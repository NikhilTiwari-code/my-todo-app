// src/components/feed/CommentItem.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Comment {
  _id: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  text: string;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  createdAt: string;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onLikeToggle: (commentId: string, isLiked: boolean, likeCount: number) => void;
  onDelete: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  postId,
  onLikeToggle,
  onDelete,
}: CommentItemProps) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnComment = comment.userId._id === user?.id;

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/comments/${comment._id}/like`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        onLikeToggle(comment._id, data.isLiked, data.likeCount);
      }
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        onDelete(comment._id);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setDeleting(false);
    }
  };

  const loadReplies = async () => {
    try {
      const res = await fetch(`/api/comments/${comment._id}/replies`);
      const data = await res.json();

      if (data.success) {
        setReplies(data.replies);
        setShowReplies(true);
      }
    } catch (error) {
      console.error("Failed to load replies:", error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: replyText.trim(),
          parentCommentId: comment._id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setReplies((prev) => [...prev, data.comment]);
        setReplyText("");
        setShowReplies(true);
      }
    } catch (error) {
      console.error("Failed to reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${comment.userId._id}`}>
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {comment.userId.avatar ? (
              <Image
                src={comment.userId.avatar}
                alt={comment.userId.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-semibold">
                {comment.userId.name[0].toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-2">
            <Link
              href={`/profile/${comment.userId._id}`}
              className="font-semibold text-sm hover:underline"
            >
              {comment.userId.username}
            </Link>
            <p className="text-sm break-words">{comment.text}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 px-2 text-xs text-gray-500">
            <button
              onClick={handleLike}
              className={`hover:text-red-500 ${
                comment.isLiked ? "text-red-500 font-semibold" : ""
              }`}
            >
              {comment.isLiked ? "Liked" : "Like"}
              {comment.likeCount > 0 && ` (${comment.likeCount})`}
            </button>

            <button
              onClick={() => setShowReplies(!showReplies)}
              className="hover:text-blue-500"
            >
              Reply
            </button>

            {isOwnComment && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="hover:text-red-500 disabled:opacity-50"
              >
                Delete
              </button>
            )}

            <span>
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* View Replies */}
          {comment.replyCount > 0 && !showReplies && (
            <button
              onClick={loadReplies}
              className="flex items-center gap-1 mt-2 px-2 text-xs text-gray-600 hover:text-blue-500"
            >
              <MessageCircle className="w-3 h-3" />
              View {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
            </button>
          )}

          {/* Reply Input */}
          {showReplies && (
            <form onSubmit={handleReply} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                disabled={submitting}
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!replyText.trim() || submitting}
                className="text-sm text-blue-500 font-semibold hover:text-blue-600 disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send"}
              </button>
            </form>
          )}

          {/* Replies List */}
          {showReplies && replies.length > 0 && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
              {replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  onLikeToggle={onLikeToggle}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}