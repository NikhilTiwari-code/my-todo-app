"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, User, Hash, Image, TrendingUp } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/users/UserAvatar";
import { motion } from "framer-motion";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "users" | "posts" | "hashtags">("all");

  useEffect(() => {
    if (query) {
      fetchResults();
    }
  }, [query, tab]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const type = tab === "all" ? "all" : tab;
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "all", label: "All", icon: Search },
    { id: "users", label: "Users", icon: User },
    { id: "hashtags", label: "Hashtags", icon: Hash },
    { id: "posts", label: "Posts", icon: Image },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Search results for &quot;{query}&quot;
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Users */}
            {(tab === "all" || tab === "users") && results.users?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User size={20} /> Users
                </h2>
                <div className="space-y-2">
                  {results.users.map((user: any) => (
                    <Link
                      key={user._id}
                      href={`/profile/${user._id}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                      <UserAvatar name={user.name} avatar={user.avatar} size="md" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.email?.split('@')[0]}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {(tab === "all" || tab === "hashtags") && results.hashtags?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Hash size={20} /> Hashtags
                </h2>
                <div className="space-y-2">
                  {results.hashtags.map((tag: any) => (
                    <Link
                      key={tag._id}
                      href={`/hashtags/${tag.hashtag}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Hash size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            #{tag.hashtag}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {tag.postCount || 0} posts
                          </p>
                        </div>
                      </div>
                      {tag.trendingScore > 50 && (
                        <TrendingUp size={16} className="text-orange-500" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {(tab === "all" || tab === "posts") && results.posts?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Image size={20} /> Posts
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {results.posts.map((post: any, index: number) => (
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
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {Object.values(results).every((arr: any) => !arr || arr.length === 0) && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-12 text-center">
                <Search size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Try searching for something else
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
