"use client";

import { useState, useRef } from "react";
import NextImage from "next/image";
import { UserAvatar } from "@/components/users/UserAvatar";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onUploadSuccess?: (avatarUrl: string) => void;
}

export function AvatarUpload({ 
  currentAvatar, 
  userName,
  onUploadSuccess 
}: AvatarUploadProps) {
  const [avatar, setAvatar] = useState(currentAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPG, PNG, GIF, etc.)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);

        // Upload to server
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ avatar: base64String }),
        });

        if (res.ok) {
          const data = await res.json();
          const newAvatar = data.data.user.avatar;
          setAvatar(newAvatar);
          setPreviewUrl(null);
          onUploadSuccess?.(newAvatar);
          alert("Profile photo updated successfully! ✅");
        } else {
          const error = await res.json();
          alert(error.error || "Failed to upload avatar");
          setPreviewUrl(null);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) {
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatar: "" }),
      });

      if (res.ok) {
        setAvatar(undefined);
        setPreviewUrl(null);
        onUploadSuccess?.("");
        alert("Profile photo removed successfully!");
      } else {
        alert("Failed to remove avatar");
      }
    } catch (error) {
      console.error("Error removing avatar:", error);
      alert("Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-blue-200 dark:border-gray-700">
      {/* Avatar Display */}
      <div className="relative">
        <div className="ring-4 ring-white dark:ring-gray-800 rounded-full">
          {previewUrl ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden animate-pulse">
              <NextImage 
                src={previewUrl} 
                alt="Preview" 
                fill
                className="object-cover"
                sizes="128px"
                priority
                unoptimized
              />
            </div>
          ) : (
            <UserAvatar avatar={avatar} name={userName} size="xl" />
          )}
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Upload Buttons */}
      <div className="flex gap-3">
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
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : avatar ? "Change Photo" : "Upload Photo"}
        </button>

        {avatar && (
          <button
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium shadow-lg hover:bg-red-600 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Remove
          </button>
        )}
      </div>

      {/* Info Text */}
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Recommended: Square image, max 5MB
        <br />
        Supported formats: JPG, PNG, GIF
      </p>
    </div>
  );
}
