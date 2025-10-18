"use client";

import { useState } from "react";
import { X, ArrowLeft, Send } from "lucide-react";
import { UserSelectList } from "./UserSelectList";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface InternalShareModalProps {
  postId?: string;
  reelId?: string;
  storyId?: string;
  onClose: () => void;
  onBack: () => void;
  onSuccess?: () => void;
}

export function InternalShareModal({
  postId,
  reelId,
  storyId,
  onClose,
  onBack,
  onSuccess,
}: InternalShareModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientIds: selectedUsers,
          postId,
          reelId,
          storyId,
          message: message.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        onSuccess?.();
        onClose();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send to</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          <UserSelectList
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
          />
        </div>

        {/* Message Input */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-t dark:border-gray-700">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message... (optional)"
              className="w-full p-3 border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              maxLength={500}
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {message.length}/500
            </div>
          </div>
        )}

        {/* Send Button */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-t dark:border-gray-700">
            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send to {selectedUsers.length} user
                  {selectedUsers.length > 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
