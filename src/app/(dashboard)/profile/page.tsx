"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bio, setBio] = useState("");
  const [isUpdatingBio, setIsUpdatingBio] = useState(false);

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile", {
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.data.user);
        setBio(data.data.user.bio || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBio = async () => {
    setIsUpdatingBio(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bio }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData(data.data.user);
        alert("Bio updated successfully! ✅");
      } else {
        alert("Failed to update bio");
      }
    } catch (error) {
      console.error("Error updating bio:", error);
      alert("Failed to update bio");
    } finally {
      setIsUpdatingBio(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Profile
        </h1>
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-32 w-32 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Profile Settings
      </h1>

      {/* Avatar Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentAvatar={profileData?.avatar}
            userName={user?.name || ""}
            onUploadSuccess={async (avatarUrl) => {
              if (profileData) {
                setProfileData({ ...profileData, avatar: avatarUrl });
              }
              // Refresh auth context to update navbar avatar
              await refreshUser();
            }}
          />
        </CardContent>
      </Card>

      {/* Bio Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tell others about yourself (max 500 characters)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder="I love building todo apps! 🚀"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
            />
            <div className="text-sm text-gray-500 mt-1">
              {bio.length}/500 characters
            </div>
          </div>
          <Button
            onClick={handleUpdateBio}
            disabled={isUpdatingBio || bio === profileData?.bio}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isUpdatingBio ? "Updating..." : "Update Bio"}
          </Button>
        </CardContent>
      </Card>

      {/* Social Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Social Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => profileData?.id && router.push(`/friends/${profileData.id}/followers`)}
              className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-300">
                {profileData?.followersCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Followers
              </div>
            </button>
            <button
              onClick={() => profileData?.id && router.push(`/friends/${profileData.id}/following`)}
              className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-300">
                {profileData?.followingCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Following
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Name
            </label>
            <p className="text-lg text-gray-900 dark:text-gray-100">
              {user?.name || "N/A"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Email
            </label>
            <p className="text-lg text-gray-900 dark:text-gray-100">
              {user?.email || "N/A"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Member Since
            </label>
            <p className="text-lg text-gray-900 dark:text-gray-100">
              {profileData?.createdAt 
                ? new Date(profileData.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })
                : "N/A"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              User ID
            </label>
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {user?.id || "N/A"}
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="destructive" onClick={logout}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
