"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { ProfileSkeleton, ProfileGridSkeleton } from "@/components/profile/ProfileSkeleton";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import toast from "react-hot-toast";

type TabType = "posts" | "reels" | "saved" | "tagged";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [contentData, setContentData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);

  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/profile", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData(data.data.user);
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch content based on active tab
  const fetchContent = async (tab: TabType) => {
    try {
      setIsContentLoading(true);
      
      let endpoint = "";
      switch (tab) {
        case "posts":
          endpoint = `/api/feed/user/${user?.id}`;
          break;
        case "reels":
          endpoint = `/api/reels/user/${user?.id}`;
          break;
        case "saved":
          endpoint = `/api/saved`;
          break;
        case "tagged":
          endpoint = `/api/tagged/${user?.id}`;
          break;
      }

      const res = await fetch(endpoint, { credentials: "include" });
      
      if (res.ok) {
        const data = await res.json();
        // Map data to unified format
        const items = (data.data?.posts || data.data?.reels || data.data?.items || []).map((item: any) => ({
          _id: item._id,
          type: tab === "reels" ? "reel" : "post",
          imageUrl: item.imageUrl || item.image,
          videoUrl: item.videoUrl || item.video,
          caption: item.caption,
          likes: item.likes || [],
          comments: item.comments?.length || 0,
        }));
        setContentData(items);
      } else {
        setContentData([]);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      setContentData([]);
    } finally {
      setIsContentLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  useEffect(() => {
    if (user && profileData) {
      fetchContent(activeTab);
    }
  }, [activeTab, user, profileData]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleShareClick = () => {
    const url = `${window.location.origin}/profile/${user?.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied! 🔗");
  };

  const handleCoverUploadSuccess = (coverUrl: string) => {
    setProfileData((prev: any) => ({ ...prev, coverPhoto: coverUrl }));
    fetchProfileData(); // Refresh profile data
    refreshUser(); // Update auth context
  };

  const handleAvatarUploadSuccess = (avatarUrl: string) => {
    setProfileData((prev: any) => ({ ...prev, avatar: avatarUrl }));
    fetchProfileData(); // Refresh profile data
    refreshUser(); // Update auth context
  };

  const handleProfileUpdateSuccess = () => {
    fetchProfileData(); // Refresh profile data after edit
    refreshUser(); // Update auth context
  };

  const handleItemClick = (item: any) => {
    if (item.type === "reel") {
      router.push(`/reels?id=${item._id}`);
    } else {
      router.push(`/feed?postId=${item._id}`);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoading || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Profile Header */}
          <ProfileHeader
            user={{
              _id: profileData.id || user.id,
              name: user.name,
              email: user.email,
              avatar: profileData.avatar || user.avatar,
              coverPhoto: profileData.coverPhoto,
              bio: profileData.bio,
              website: profileData.website,
              location: profileData.location,
              isVerified: profileData.isVerified,
              createdAt: profileData.createdAt,
              followers: (user as any).followers || [],
              following: (user as any).following || [],
            }}
            currentUserId={user.id}
            postsCount={activeTab === "posts" ? contentData.length : 0}
            isFollowing={false}
            onEditClick={handleEditClick}
            onShareClick={handleShareClick}
            onCoverUploadSuccess={handleCoverUploadSuccess}
            onAvatarUploadSuccess={handleAvatarUploadSuccess}
          />

          {/* Content Tabs & Grid */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isOwner={true}
            />

            <div className="p-4">
              {isContentLoading ? (
                <ProfileGridSkeleton />
              ) : (
                <ProfileGrid items={contentData} onItemClick={handleItemClick} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={{
          _id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: profileData.bio,
          website: profileData.website,
          location: profileData.location,
          birthday: profileData.birthday,
          gender: profileData.gender,
          isPrivate: profileData.isPrivate,
        }}
        onSuccess={handleProfileUpdateSuccess}
      />
    </>
  );
}
