"use client";

import { UserAvatar } from "@/components/users/UserAvatar";

interface StoryRingProps {
  avatar?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  hasStory?: boolean;
  hasUnviewedStory?: boolean;
  onClick?: () => void;
}

export function StoryRing({ 
  avatar, 
  name, 
  size = "md", 
  hasStory = false,
  hasUnviewedStory = false,
  onClick 
}: StoryRingProps) {
  const ringClass = hasStory
    ? hasUnviewedStory
      ? "ring-4 ring-gradient-to-r from-purple-500 to-pink-500 p-1 bg-gradient-to-r from-purple-500 to-pink-500"
      : "ring-4 ring-gray-400 dark:ring-gray-600 p-1"
    : "";

  return (
    <div
      onClick={onClick}
      className={`rounded-full ${ringClass} ${onClick ? 'cursor-pointer' : ''} transition-all hover:scale-105`}
    >
      <div className="bg-white dark:bg-gray-900 rounded-full p-0.5">
        <UserAvatar avatar={avatar} name={name} size={size} />
      </div>
    </div>
  );
}
