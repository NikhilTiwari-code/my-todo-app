"use client";

import { useState } from "react";
import { Search, Hash, TrendingUp, Users, Sparkles } from "lucide-react";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { TrendingHashtags } from "@/components/hashtags/TrendingHashtags";
import Link from "next/link";

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<"search" | "hashtags" | "users">("search");

  const quickSearches = [
    { query: "fitness", icon: "💪", category: "Health & Fitness" },
    { query: "food", icon: "🍔", category: "Food & Cooking" },
    { query: "travel", icon: "✈️", category: "Travel" },
    { query: "tech", icon: "💻", category: "Technology" },
    { query: "fashion", icon: "👗", category: "Fashion" },
    { query: "music", icon: "🎵", category: "Music" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Discover
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Find people, posts, and trending topics
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <GlobalSearchBar />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === "search"
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-lg"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-900/50"
            }`}
          >
            <Search size={20} />
            Quick Search
          </button>
          <button
            onClick={() => setActiveTab("hashtags")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === "hashtags"
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-lg"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-900/50"
            }`}
          >
            <Hash size={20} />
            Trending Hashtags
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === "users"
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-lg"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-900/50"
            }`}
          >
            <Users size={20} />
            Suggested Users
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === "search" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Quick Searches
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {quickSearches.map((item) => (
                    <Link
                      key={item.query}
                      href={`/search?q=${encodeURIComponent(item.query)}`}
                      className="bg-white dark:bg-gray-900 rounded-2xl p-6 hover:shadow-lg transition-all border dark:border-gray-800 group"
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {item.category}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Search #{item.query}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* How to Use Guide */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mt-8 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles size={20} className="text-blue-600" />
                    How to Use Discover
                  </h3>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">🔍</span>
                      <span><strong>Search:</strong> Type anything in the search bar to find users, posts, and hashtags instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">@</span>
                      <span><strong>Mentions:</strong> Type @ in posts/comments to mention users and notify them</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-600 dark:text-pink-400 font-bold">#</span>
                      <span><strong>Hashtags:</strong> Use #hashtags in posts to categorize content and make it discoverable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 dark:text-orange-400 font-bold">🔥</span>
                      <span><strong>Trending:</strong> Check trending hashtags to see what&apos;s popular right now</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "hashtags" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  All Trending Hashtags
                </h2>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
                  <TrendingHashtags />
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Suggested Users
                </h2>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Suggested users feature coming soon!
                    <br />
                    <span className="text-sm">Use the search bar to find users to follow</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Hashtags Widget */}
            <TrendingHashtags />

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-purple-600" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>💡 Use multiple hashtags for better reach</li>
                <li>💡 Mention friends to grow your network</li>
                <li>💡 Search users to find new connections</li>
                <li>💡 Click trending hashtags to join conversations</li>
              </ul>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Discovery Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Your Searches</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {localStorage.getItem('recentSearches') 
                      ? JSON.parse(localStorage.getItem('recentSearches') || '[]').length 
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
