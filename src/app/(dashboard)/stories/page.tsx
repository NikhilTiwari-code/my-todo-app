"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { StoryUpload } from "@/components/stories/StoryUpload";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { StoryRing } from "@/components/stories/StoryRing";
import { useAuth } from "@/contexts/AuthContext";

interface Story {
  _id: string;
  userId: any;
  content?: string;
  imageUrl?: string;
  type: "text" | "image" | "both";
  views: any[];
  createdAt: string;
  hasViewed?: boolean;
}

interface UserStories {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  stories: Story[];
  hasViewed: boolean;
}

export default function StoriesPage() {
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [selectedStories, setSelectedStories] = useState<Story[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStories = async () => {
    try {
      const res = await fetch("/api/stories", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUserStories(data.stories);
      }
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const myStories = userStories.find((us) => us.user._id === user?.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Stories
        </h1>
      </div>

      {/* Stories Grid */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {/* Your Story / Add Story */}
            <div
              onClick={() => myStories ? setSelectedStories(myStories.stories) : setShowUpload(true)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="relative">
                {myStories ? (
                  <StoryRing
                    avatar={user?.avatar}
                    name={user?.name || "You"}
                    size="lg"
                    hasStory={true}
                    hasUnviewedStory={false}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Plus className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-white text-center">
                {myStories ? "Your Story" : "Add Story"}
              </p>
            </div>

            {/* Friends' Stories */}
            {userStories
              .filter((us) => us.user._id !== user?.id)
              .map((userStory) => (
                <div
                  key={userStory.user._id}
                  onClick={() => setSelectedStories(userStory.stories)}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <StoryRing
                    avatar={userStory.user.avatar}
                    name={userStory.user.name}
                    size="lg"
                    hasStory={true}
                    hasUnviewedStory={!userStory.hasViewed}
                  />
                  <p className="text-xs font-medium text-gray-900 dark:text-white text-center line-clamp-2">
                    {userStory.user.name}
                  </p>
                </div>
              ))}
          </div>
        )}

        {!isLoading && userStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No stories yet. Be the first to share!
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Create Your First Story
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <StoryUpload
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            loadStories();
            setShowUpload(false);
          }}
        />
      )}

      {/* Story Viewer */}
      {selectedStories && (
        <StoryViewer
          stories={selectedStories}
          onClose={() => {
            setSelectedStories(null);
            loadStories(); // Refresh to update view status
          }}
        />
      )}
    </div>
  );
}
