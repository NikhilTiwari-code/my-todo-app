"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Hash, User, Image, TrendingUp, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "../users/UserAvatar";

interface SearchResult {
  users?: any[];
  posts?: any[];
  hashtags?: any[];
  trending?: any[];
}

export function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>({});
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem("recentSearches");
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Search with debounce
  useEffect(() => {
    if (query.length === 0) {
      setResults({});
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`,
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
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSearch = (searchQuery: string) => {
    const recent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(recent);
    localStorage.setItem("recentSearches", JSON.stringify(recent));
  };

  const handleUserClick = (userId: string) => {
    saveSearch(query);
    setIsOpen(false);
    setQuery("");
    router.push(`/profile/${userId}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    saveSearch(`#${hashtag}`);
    setIsOpen(false);
    setQuery("");
    router.push(`/hashtags/${hashtag}`);
  };

  const handlePostClick = (postId: string) => {
    saveSearch(query);
    setIsOpen(false);
    setQuery("");
    router.push(`/feed?postId=${postId}`);
  };

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
    inputRef.current?.focus();
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const handleFullSearch = () => {
    if (query.trim()) {
      saveSearch(query);
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const totalResults = Object.values(results).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && handleFullSearch()}
          placeholder="Search users, posts, #hashtags..."
          className="w-full pl-10 pr-10 py-2 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-900 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50"
          >
            {query.length === 0 ? (
              /* Recent Searches */
              <div className="p-3">
                {recentSearches.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2 px-2">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Recent</h3>
                      <button
                        onClick={clearRecent}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                    {recentSearches.map((recent, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentClick(recent)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{recent}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Start typing to search...
                  </p>
                )}
              </div>
            ) : loading ? (
              /* Loading */
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Searching...</p>
              </div>
            ) : totalResults === 0 ? (
              /* No Results */
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No results found for &quot;{query}&quot;</p>
              </div>
            ) : (
              /* Results */
              <div className="divide-y dark:divide-gray-700">
                {/* Users */}
                {results.users && results.users.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2 flex items-center gap-2">
                      <User size={14} /> Users
                    </h3>
                    {results.users.map((user: any) => (
                      <button
                        key={user._id}
                        onClick={() => handleUserClick(user._id)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">@{user.email?.split('@')[0]}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Hashtags */}
                {results.hashtags && results.hashtags.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2 flex items-center gap-2">
                      <Hash size={14} /> Hashtags
                    </h3>
                    {results.hashtags.map((tag: any) => (
                      <button
                        key={tag._id}
                        onClick={() => handleHashtagClick(tag.hashtag)}
                        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          #{tag.hashtag}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {tag.postCount || 0} posts
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Posts */}
                {results.posts && results.posts.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2 flex items-center gap-2">
                      <Image size={14} /> Posts
                    </h3>
                    {results.posts.map((post: any) => (
                      <button
                        key={post._id}
                        onClick={() => handlePostClick(post._id)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                      >
                        {post.images && post.images[0] && (
                          <img
                            src={post.images[0]}
                            alt="Post"
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 text-left">
                          <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                            {post.caption || "No caption"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* View All Button */}
                {totalResults > 0 && (
                  <div className="p-3">
                    <button
                      onClick={handleFullSearch}
                      className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    >
                      View all results for &quot;{query}&quot;
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
