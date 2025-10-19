/**
 * 🔥 Trending Page - Main Page Component
 * 
 * Displays trending topics with real-time updates via Socket.io
 * Features: Category filtering, infinite scroll, search integration
 */

'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import TrendingCard from '@/components/trending/TrendingCard';
import CategoryTabs from '@/components/trending/CategoryTabs';
import SearchBar from '@/components/trending/SearchBar';
import TestFetchButton from './test-fetch';

export default function TrendingPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [trendingData, setTrendingData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch trending data
  const fetchTrending = async (category?: string, showLoader = true) => {
    if (showLoader) setLoading(true);
    
    try {
      const url = category && category !== 'all'
        ? `/api/trending?category=${category}`
        : '/api/trending';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (category && category !== 'all') {
          setTrendingData((prev: any) => ({
            ...prev,
            [category]: data.data,
          }));
        } else {
          setTrendingData(data.data);
        }
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch trending:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize Socket.io for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchTrending();

    // Initialize Socket.io (if you have it set up)
    // Uncomment when Socket.io is fully configured
    /*
    const token = localStorage.getItem('token');
    if (token) {
      const newSocket = io({
        auth: { token },
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to trending updates');
      });

      newSocket.on('trending:update', (data) => {
        console.log('📡 Received trending update:', data);
        fetchTrending(undefined, false);
      });

      newSocket.on('trending:refresh', () => {
        console.log('🔄 Refresh signal received');
        fetchTrending(undefined, false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
    */
  }, []);

  // Refresh trending data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrending();
  };

  // Get data for current category
  const getCurrentData = () => {
    if (activeCategory === 'all') {
      // Combine all categories
      const allItems: any[] = [];
      Object.entries(trendingData).forEach(([category, items]) => {
        if (Array.isArray(items)) {
          allItems.push(...items);
        }
      });
      return allItems.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 50);
    }
    
    return trendingData[activeCategory] || [];
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Title & Refresh */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trending Now
              </h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <SearchBar />
          </div>

          {/* Category Tabs */}
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Last Updated */}
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          // Loading State
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : currentData.length === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No trending topics yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for trending content
            </p>
          </div>
        ) : (
          // Trending Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map((item: any, index: number) => (
              <TrendingCard
                key={item._id || index}
                title={item.title}
                category={item.category}
                source={item.source}
                url={item.url}
                imageUrl={item.imageUrl}
                description={item.description}
                rank={item.rank}
                score={item.score}
                publishedAt={item.publishedAt}
                metadata={item.metadata}
              />
            ))}
          </div>
        )}
      </div>

      {/* Test Fetch Button - Remove this after getting data */}
      <TestFetchButton />
    </div>
  );
}
