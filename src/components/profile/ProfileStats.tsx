"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ProfileStatsProps {
  posts: number;
  followers: number;
  following: number;
  userId: string;
  isOwner: boolean;
}

export function ProfileStats({ posts, followers, following, userId, isOwner }: ProfileStatsProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    {
      label: "Posts",
      value: posts,
      onClick: isOwner ? () => {} : undefined,
      clickable: false,
    },
    {
      label: "Followers",
      value: followers,
      onClick: () => router.push(`/profile/${userId}/followers`),
      clickable: true,
    },
    {
      label: "Following",
      value: following,
      onClick: () => router.push(`/profile/${userId}/following`),
      clickable: true,
    },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-8 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-6 md:gap-12 py-6 px-4">
      {stats.map((stat, index) => (
        <motion.button
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          onClick={stat.clickable ? stat.onClick : undefined}
          disabled={!stat.clickable}
          className={`flex flex-col items-center group ${
            stat.clickable
              ? "cursor-pointer hover:scale-105 transition-transform duration-200"
              : "cursor-default"
          }`}
        >
          <motion.span
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1"
            whileHover={stat.clickable ? { scale: 1.1 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {formatNumber(stat.value)}
          </motion.span>
          <span
            className={`text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium ${
              stat.clickable
                ? "group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                : ""
            }`}
          >
            {stat.label}
          </span>

          {/* Animated underline for clickable stats */}
          {stat.clickable && (
            <motion.div
              className="h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mt-1"
              initial={{ width: 0 }}
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
