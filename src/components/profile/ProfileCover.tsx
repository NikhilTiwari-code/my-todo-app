"use client";

import { useState, useRef } from "react";
import NextImage from "next/image";
import { Camera, X } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileCoverProps {
  coverPhoto?: string;
  isOwner: boolean;
  onUploadSuccess?: (coverUrl: string) => void;
}

export function ProfileCover({ coverPhoto, isOwner, onUploadSuccess }: ProfileCoverProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging
  console.log("ProfileCover - coverPhoto:", coverPhoto);
  console.log("ProfileCover - preview:", preview);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading("Uploading cover photo...");

    try {
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setPreview(base64String);

        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ coverPhoto: base64String }),
        });

        if (res.ok) {
          const data = await res.json();
          const newCover = data.data.user.coverPhoto;
          // Keep preview until parent updates the prop
          onUploadSuccess?.(newCover);
          toast.success("Cover photo updated! 🎉", { id: loadingToast });
          // Clear preview after a short delay to allow prop update
          setTimeout(() => setPreview(null), 500);
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to upload cover photo", { id: loadingToast });
          setPreview(null);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast.error("Failed to upload cover photo", { id: loadingToast });
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!confirm("Remove cover photo?")) return;

    setIsUploading(true);
    const loadingToast = toast.loading("Removing cover photo...");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coverPhoto: "" }),
      });

      if (res.ok) {
        setPreview(null);
        onUploadSuccess?.("");
        toast.success("Cover photo removed!", { id: loadingToast });
      } else {
        toast.error("Failed to remove cover photo", { id: loadingToast });
      }
    } catch (error) {
      console.error("Error removing cover:", error);
      toast.error("Failed to remove cover photo", { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const displayCover = preview || coverPhoto;
  const hasCover = displayCover && displayCover.trim() !== "";
  const isBase64 = displayCover?.startsWith("data:image");
  const isCloudinaryUrl = displayCover?.includes("cloudinary.com");

  console.log("Cover Debug:", {
    hasCover,
    isBase64,
    isCloudinaryUrl,
    coverLength: displayCover?.length,
    fullUrl: displayCover
  });

  return (
    <div className="relative w-full h-52 sm:h-60 md:h-72 overflow-hidden">
      {/* Cover Image */}
      {hasCover ? (
        <div className="relative w-full h-full">
          <img
            src={displayCover}
            alt="Cover"
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log("✅ Cover image loaded successfully:", displayCover);
            }}
            onError={(e) => {
              console.error("❌ Cover image failed to load:", displayCover);
              console.error("Error event:", e);
            }}
          />
          {/* Subtle gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTI0IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0xMiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        </div>
      )}

      {/* Edit Controls (owner only) */}
      {isOwner && (
        <div className="absolute top-3 right-3 z-20 flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/95 backdrop-blur-sm hover:bg-white text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm"
          >
            <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">{hasCover ? "Change Cover" : "Add Cover"}</span>
            <span className="sm:hidden">Cover</span>
          </button>

          {hasCover && (
            <button
              onClick={handleRemoveCover}
              disabled={isUploading}
              className="p-1.5 sm:p-2 bg-red-500/95 backdrop-blur-sm hover:bg-red-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center disabled:opacity-50"
              title="Remove cover"
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-semibold">Uploading...</p>
          </div>
        </div>
      )}

    </div>
  );
}
