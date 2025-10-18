// 📍 PASTE YOUR REEL COMMENTS COMPONENT HERE
// Comments section drawer

"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  _id: string;
  name: string;
  avatar?: string;
  username?: string;
}

interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
}

interface ReelCommentsProps {
  reelId: string;
  comments: Comment[];
  onClose: () => void;
  onAddComment: (text: string) => void;
}

export function ReelComments({
  reelId,
  comments,
  onClose,
  onAddComment,
}: ReelCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll to bottom when new comments are added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md mx-auto bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Comments ({comments.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No comments yet.</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <img
                  src={comment.user.avatar || "/default-avatar.png"}
                  alt={comment.user.name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {comment.user.name}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1 break-words">
                    {comment.text}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="text-gray-500 hover:text-red-500 text-xs flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>0</span>
                    </button>
                    <button className="text-gray-500 hover:text-blue-500 text-xs">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <img
              src="/default-avatar.png" // Replace with current user avatar
              alt="Your avatar"
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1 flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
          {newComment.length > 400 && (
            <p className="text-xs text-gray-500 mt-2 text-right">
              {newComment.length}/500
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
