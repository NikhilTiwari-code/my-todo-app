"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon, Type } from "lucide-react";
import NextImage from "next/image";
import { useSocket } from "@/contexts/SocketContext";

interface StoryUploadProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function StoryUpload({ onClose, onSuccess }: StoryUploadProps) {
  const { socket } = useSocket();
  const [type, setType] = useState<"text" | "image" | "both">("text");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      if (type === "text") {
        setType("both");
      } else if (!content) {
        setType("image");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (type === "text" && !content.trim()) {
      alert("Please add some text to your story");
      return;
    }

    if ((type === "image" || type === "both") && !imageUrl) {
      alert("Please select an image");
      return;
    }

    setIsUploading(true);

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim() || undefined,
          imageUrl,
          type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Emit socket event to notify followers
        if (socket && data.followers) {
          socket.emit("story:new", {
            storyId: data.story._id,
            followers: data.followers,
          });
        }
        
        alert("Story posted! 🎉");
        onSuccess?.();
        onClose();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to post story");
      }
    } catch (error) {
      console.error("Error posting story:", error);
      alert("Failed to post story. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Story
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setType("text")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                type === "text" || type === "both"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Type className="w-5 h-5 inline mr-2" />
              Text
            </button>
            <button
              onClick={() => setType("image")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                type === "image" || type === "both"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <ImageIcon className="w-5 h-5 inline mr-2" />
              Photo
            </button>
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <NextImage
                src={imageUrl}
                alt="Story preview"
                fill
                className="object-cover"
                unoptimized
              />
              <button
                onClick={() => {
                  setImageUrl(null);
                  if (type === "both") setType("text");
                  else if (type === "image") setType("text");
                }}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Upload Button */}
          {!imageUrl && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
              >
                <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload image
                </p>
              </button>
            </div>
          )}

          {/* Text Input */}
          {(type === "text" || type === "both") && (
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share what's on your mind..."
                maxLength={500}
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                {content.length}/500
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Posting..." : "Post Story"}
          </button>
        </div>
      </div>
    </div>
  );
}
