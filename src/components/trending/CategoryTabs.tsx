/**
 * 📑 Category Tabs Component
 * 
 * Horizontal tabs for switching between trending categories
 */

'use client';

import React from 'react';
import { Newspaper, Youtube, Code, Bitcoin, Tv, Trophy, Landmark } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'All', icon: Newspaper },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'tech', label: 'Tech', icon: Code },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin },
  { id: 'entertainment', label: 'Entertainment', icon: Tv },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'politics', label: 'Politics', icon: Landmark },
];

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg min-w-max">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                ${isActive
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
