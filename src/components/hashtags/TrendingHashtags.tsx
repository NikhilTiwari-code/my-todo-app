"use client";

import { useState, useEffect } from "react";
import { Hash, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface HashtagItem {
  _id: string;
  hashtag: string;
  postCount: number;
  trendingScore: number;
  category?: string;
}

export function TrendingHashtags() {
  const [hashtags, setHashtags] = useState<HashtagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await fetch("/api/hashtags/trending", {
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setHashtags(data.hashtags || []);
      }
    } catch (error) {
      console.error("Failed to fetch trending hashtags:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-gray-400" />
          <h2 className="font-bold text-gray-900 dark:text-white">Trending Hashtags</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-850 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hashtags.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
          <TrendingUp size={20} className="text-white" />
        </div>
        <h2 className="font-bold text-gray-900 dark:text-white">Trending Now</h2>
      </div>

      {/* Hashtag List */}
      <div className="space-y-3">
        {hashtags.map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={`/hashtags/${item.hashtag}`}
              className="block group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl p-3 -mx-3 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Hash size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      #{item.hashtag}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.postCount.toLocaleString()} posts
                    </p>
                    {item.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
                {item.trendingScore > 80 && (
                  <Sparkles size={16} className="text-yellow-500 flex-shrink-0 animate-pulse" />
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* View All */}
      <Link
        href="/explore/hashtags"
        className="block mt-4 pt-4 border-t dark:border-gray-800 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        View all trending hashtags
      </Link>
    </div>
  );
}
