/**
 * 🔍 Universal Search Bar Component
 * 
 * Search across users, posts, reels, trending topics, and hashtags
 * Features: Debouncing, auto-suggestions, recent searches
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Clock, TrendingUp, Hash, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
}

export default function SearchBar({
  placeholder = 'Search trending, users, posts...',
  autoFocus = false,
  showSuggestions = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
    
    // Fetch popular searches
    fetchPopularSearches();
  }, []);

  // Fetch popular searches
  const fetchPopularSearches = async () => {
    try {
      const response = await fetch('/api/search/popular?limit=5');
      const data = await response.json();
      if (data.success) {
        setPopularSearches(data.data.map((item: any) => item.query));
      }
    } catch (error) {
      console.error('Failed to fetch popular searches:', error);
    }
  };

  // Custom debounce implementation
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        
        if (data.success) {
          const allResults: any[] = [];
          
          // Add users
          if (data.results.users?.length) {
            allResults.push(...data.results.users.map((u: any) => ({
              type: 'user',
              ...u,
            })));
          }
          
          // Add trending
          if (data.results.trending?.length) {
            allResults.push(...data.results.trending.map((t: any) => ({
              type: 'trending',
              ...t,
            })));
          }
          
          // Add hashtags
          if (data.results.hashtags?.length) {
            allResults.push(...data.results.hashtags.map((h: any) => ({
              type: 'hashtag',
              ...h,
            })));
          }
          
          setSuggestions(allResults.slice(0, 8));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);
    
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSuggestions([]);
    }
  };

  // Handle search submit
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    
    if (!finalQuery.trim()) return;

    // Save to recent searches
    const updated = [finalQuery, ...recentSearches.filter(s => s !== finalQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate to search results page
    router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
    setShowDropdown(false);
    setQuery('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (item: any) => {
    if (item.type === 'user') {
      router.push(`/profile/${item._id}`);
    } else if (item.type === 'trending') {
      window.open(item.url, '_blank');
    } else if (item.type === 'hashtag') {
      router.push(`/hashtag/${item.hashtag}`);
    }
    setShowDropdown(false);
    setQuery('');
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
            if (e.key === 'Escape') {
              setShowDropdown(false);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-12 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
        />

        {/* Clear/Loading Icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Suggestions */}
      {showSuggestions && showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
          {/* Live Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
                Suggestions
              </p>
              {suggestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  {item.type === 'user' && (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        {item.avatar ? (
                          <img src={item.avatar} alt={item.name} className="w-full h-full rounded-full" />
                        ) : (
                          <span className="text-lg font-bold text-white">{item.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                      </div>
                    </>
                  )}
                  {item.type === 'trending' && (
                    <>
                      <TrendingUp className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.source}</p>
                      </div>
                    </>
                  )}
                  {item.type === 'hashtag' && (
                    <>
                      <Hash className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">#{item.hashtag}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.postCount} posts</p>
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
                Recent Searches
              </p>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {!query && popularSearches.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
                Trending Searches
              </p>
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  <span className="text-gray-900 dark:text-white">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
