"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Hash, Grid3x3, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Post {
  _id: string;
  images: string[];
  caption: string;
  likeCount: number;
  commentCount: number;
  userId: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

interface HashtagStats {
  postCount: number;
  trendingScore: number;
  category: string;
}

export default function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = use(params);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<HashtagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"recent" | "top">("recent");

  useEffect(() => {
    fetchHashtagData();
  }, [tag, tab]);

  const fetchHashtagData = async () => {
    setLoading(true);
    try {
      // Fetch posts with this hashtag
      const res = await fetch(
        `/api/hashtags/${tag}?sort=${tab}`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (data.success) {
        setPosts(data.posts || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch hashtag data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Hash size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                #{tag}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {stats?.postCount || 0} posts
              </p>
            </div>
          </div>

          {stats && (
            <div className="flex items-center gap-6 text-sm">
              {stats.trendingScore > 50 && (
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <TrendingUp size={16} />
                  <span className="font-semibold">Trending</span>
                </div>
              )}
              {stats.category && (
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                  {stats.category}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("recent")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              tab === "recent"
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-900/50"
            }`}
          >
            <Clock size={18} />
            Recent
          </button>
          <button
            onClick={() => setTab("top")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              tab === "top"
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-900/50"
            }`}
          >
            <TrendingUp size={18} />
            Top
          </button>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-12 text-center">
            <Hash size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No posts found with #{tag}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Be the first to post with this hashtag!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {posts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/feed?postId=${post._id}`}
                  className="block aspect-square relative group overflow-hidden rounded-lg"
                >
                  <img
                    src={post.images[0]}
                    alt={post.caption || "Post"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="font-semibold">{post.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
                      </svg>
                      <span className="font-semibold">{post.commentCount}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
