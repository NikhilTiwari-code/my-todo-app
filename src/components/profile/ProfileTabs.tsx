"use client";

import { useState } from "react";
import { Grid3x3, Play, Bookmark, Tag } from "lucide-react";
import { motion } from "framer-motion";

type TabType = "posts" | "reels" | "saved" | "tagged";

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOwner: boolean;
}

export function ProfileTabs({ activeTab, onTabChange, isOwner }: ProfileTabsProps) {
  const tabs = [
    {
      id: "posts" as TabType,
      label: "Posts",
      icon: Grid3x3,
      show: true,
    },
    {
      id: "reels" as TabType,
      label: "Reels",
      icon: Play,
      show: true,
    },
    {
      id: "saved" as TabType,
      label: "Saved",
      icon: Bookmark,
      show: isOwner, // Only show to owner
    },
    {
      id: "tagged" as TabType,
      label: "Tagged",
      icon: Tag,
      show: true,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.show);

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-around">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex items-center justify-center gap-2 px-6 py-4 flex-1 text-sm font-semibold transition-colors group"
            >
              {/* Icon & Label */}
              <div
                className={`flex items-center gap-2 ${
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                }`}
              >
                <Icon size={20} />
                <span className="hidden sm:inline">{tab.label}</span>
              </div>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}

              {/* Hover effect */}
              {!isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-700"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
