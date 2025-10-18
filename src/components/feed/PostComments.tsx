// src/components/feed/PostComments.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import CommentItem from "./CommentItem";

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

interface PostCommentsProps {
  postId: string;
  onClose: () => void;
  onCommentAdded: () => void;
}

export default function PostComments({
  postId,
  onClose,
  onCommentAdded,
}: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=20`);
      const data = await res.json();

      if (data.success) {
        setComments((prev) => [...prev, ...data.comments]);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setCommentText("");
        onCommentAdded();
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeToggle = (commentId: string, isLiked: boolean, likeCount: number) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment._id === commentId
          ? { ...comment, isLiked, likeCount }
          : comment
      )
    );
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  postId={postId}
                  onLikeToggle={handleLikeToggle}
                  onDelete={handleDelete}
                />
              ))}

              {hasMore && (
                <button
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchComments();
                  }}
                  className="w-full py-2 text-blue-500 hover:bg-blue-50 rounded"
                >
                  Load More Comments
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t p-4 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!commentText.trim() || submitting}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}