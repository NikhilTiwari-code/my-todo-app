"use client";

import { useState, useRef } from "react";
import { ProfileCover } from "./ProfileCover";
import { ProfileStats } from "./ProfileStats";
import { ProfileBio } from "./ProfileBio";
import { ProfileActions } from "./ProfileActions";
import { UserAvatar } from "../users/UserAvatar";
import { BadgeCheck, Camera } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface ProfileHeaderProps {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    coverPhoto?: string;
    bio?: string;
    website?: string;
    location?: string;
    isVerified?: boolean;
    createdAt: string;
    followers: string[];
    following: string[];
  };
  currentUserId: string;
  postsCount?: number;
  isFollowing?: boolean;
  onEditClick?: () => void;
  onShareClick?: () => void;
  onCoverUploadSuccess?: (coverUrl: string) => void;
  onAvatarUploadSuccess?: (avatarUrl: string) => void;
  onFollowSuccess?: () => void;
}

export function ProfileHeader({
  user,
  currentUserId,
  postsCount = 0,
  isFollowing = false,
  onEditClick,
  onShareClick,
  onCoverUploadSuccess,
  onAvatarUploadSuccess,
  onFollowSuccess,
}: ProfileHeaderProps) {
  const isOwner = user._id === currentUserId;
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    const loadingToast = toast.loading("Uploading profile photo...");

    try {
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ avatar: base64String }),
        });

        if (res.ok) {
          const data = await res.json();
          const newAvatar = data.data.user.avatar;
          onAvatarUploadSuccess?.(newAvatar);
          toast.success("Profile photo updated! 🎉", { id: loadingToast });
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to upload photo", { id: loadingToast });
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload photo", { id: loadingToast });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
      {/* Cover Photo */}
      <ProfileCover
        coverPhoto={user.coverPhoto}
        isOwner={isOwner}
        onUploadSuccess={onCoverUploadSuccess}
      />

      {/* Avatar Section - Overlapping cover */}
      <div className="relative px-4 sm:px-6 md:px-8 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-20 md:-mt-24">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative group"
          >
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full ring-4 sm:ring-[5px] ring-white dark:ring-gray-900 bg-white dark:bg-gray-900 overflow-hidden shadow-2xl">
              <UserAvatar
                name={user.name}
                avatar={user.avatar}
                size="xl"
              />
              
              {/* Avatar Edit Overlay (Owner Only) */}
              {isOwner && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 bg-black/0 hover:bg-black/60 transition-all duration-200 flex items-center justify-center cursor-pointer group-hover:bg-black/50"
                    title="Change profile photo"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1">
                      {isUploadingAvatar ? (
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Camera className="text-white" size={28} />
                          <span className="text-white text-xs font-medium">Change</span>
                        </>
                      )}
                    </div>
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Actions (Desktop) */}
          <div className="hidden sm:block mb-2 sm:mb-4">
            <ProfileActions
              isOwner={isOwner}
              userId={user._id}
              isFollowing={isFollowing}
              onEditClick={onEditClick}
              onShareClick={onShareClick}
              onFollowSuccess={onFollowSuccess}
            />
          </div>
        </div>

        {/* Name & Bio Section */}
        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          {/* Name & Verified Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h1>
            {user.isVerified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
              >
                <BadgeCheck className="text-blue-500" size={20} />
              </motion.div>
            )}
          </motion.div>

          {/* Bio */}
          <ProfileBio
            bio={user.bio}
            website={user.website}
            location={user.location}
            joinedAt={user.createdAt}
            email={isOwner ? user.email : undefined}
            isOwner={isOwner}
          />
        </div>

        {/* Divider */}
        <div className="my-5 sm:my-6 border-t border-gray-200 dark:border-gray-800" />

        {/* Stats */}
        <ProfileStats
          posts={postsCount}
          followers={user.followers.length}
          following={user.following.length}
          userId={user._id}
          isOwner={isOwner}
        />

        {/* Actions (Mobile) */}
        <div className="sm:hidden mt-5">
          <ProfileActions
            isOwner={isOwner}
            userId={user._id}
            isFollowing={isFollowing}
            onEditClick={onEditClick}
            onShareClick={onShareClick}
            onFollowSuccess={onFollowSuccess}
          />
        </div>
      </div>
    </div>
  );
}
