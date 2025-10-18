"use client";

import { motion } from "framer-motion";

export function ProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden animate-pulse">
      {/* Cover Photo Skeleton */}
      <div className="w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800" />

      {/* Content Section */}
      <div className="relative px-4 md:px-6 pb-4">
        {/* Avatar Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-16 md:-mt-20">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-300 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-900" />

          {/* Action Buttons Skeleton (Desktop) */}
          <div className="hidden md:flex items-center gap-3 mb-4">
            <div className="w-32 h-10 bg-gray-300 dark:bg-gray-700 rounded-xl" />
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>

        {/* Name & Bio Skeleton */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200 dark:border-gray-800" />

        {/* Stats Skeleton */}
        <div className="flex items-center justify-center gap-12 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-7 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-1" />
              <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>

        {/* Action Buttons Skeleton (Mobile) */}
        <div className="md:hidden mt-6 flex gap-3">
          <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-700 rounded-xl" />
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProfileGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse rounded"
        />
      ))}
    </div>
  );
}
