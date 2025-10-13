"use client";

import { useState } from "react";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean, followersCount?: number) => void;
}

export function FollowButton({ 
  userId, 
  initialIsFollowing,
  onFollowChange 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async () => {
    setIsLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${userId}/follow`, { 
        method,
        credentials: "include"
      });
      
      if (res.ok) {
        const data = await res.json();
        const newState = !isFollowing;
        setIsFollowing(newState);
        onFollowChange?.(newState, data.data?.followersCount);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update follow status");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 
        ${isFollowing 
          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-500" 
          : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
        }
        ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        disabled:opacity-50`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : isFollowing ? (
        "Following ✓"
      ) : (
        "Follow"
      )}
    </button>
  );
}
