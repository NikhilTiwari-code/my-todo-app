/**
 * 🎴 Trending Card Component
 * 
 * Displays individual trending topic card with image, title, source
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink, TrendingUp, Clock, Eye, ThumbsUp, MessageCircle } from 'lucide-react';

interface TrendingCardProps {
  title: string;
  category: string;
  source: string;
  url: string;
  imageUrl?: string;
  description?: string;
  rank: number;
  score: number;
  publishedAt: Date;
  metadata?: {
    author?: string;
    views?: number;
    likes?: number;
    comments?: number;
  };
}

export default function TrendingCard({
  title,
  category,
  source,
  url,
  imageUrl,
  description,
  rank,
  score,
  publishedAt,
  metadata,
}: TrendingCardProps) {
  const timeAgo = getTimeAgo(new Date(publishedAt));

  const categoryColors: Record<string, string> = {
    news: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    youtube: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    tech: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    crypto: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    entertainment: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    politics: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Rank Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold">
        <TrendingUp className="w-3 h-3" />
        #{rank}
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category & Source */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryColors[category] || categoryColors.news}`}>
            {category.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{source}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </div>
          {metadata?.views && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(metadata.views)}
            </div>
          )}
          {metadata?.likes && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {formatNumber(metadata.likes)}
            </div>
          )}
          {metadata?.comments && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {formatNumber(metadata.comments)}
            </div>
          )}
        </div>

        {/* Author */}
        {metadata?.author && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            By {metadata.author}
          </p>
        )}

        {/* Link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          View Article
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Score indicator (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Score: {score}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
