"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { ExternalShareOptions } from "./ExternalShareOptions";
import { InternalShareModal } from "./InternalShareModal";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  postId?: string;
  reelId?: string;
  storyId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareModal({
  postId,
  reelId,
  storyId,
  onClose,
  onSuccess,
}: ShareModalProps) {
  const [showInternalShare, setShowInternalShare] = useState(false);

  if (showInternalShare) {
    return (
      <InternalShareModal
        postId={postId}
        reelId={reelId}
        storyId={storyId}
        onClose={onClose}
        onBack={() => setShowInternalShare(false)}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {/* Send to Users */}
          <button
            onClick={() => setShowInternalShare(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send size={24} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Send to Friends</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Share with people on TodoApp</p>
            </div>
          </button>

          {/* External Share Options */}
          <ExternalShareOptions
            postId={postId}
            reelId={reelId}
            storyId={storyId}
          />
        </div>
      </motion.div>
    </div>
  );
}
