"use client";

import { useSocket } from "@/contexts/SocketContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export function LiveNotificationToast() {
  const { liveNotifications, dismissLiveNotification } = useSocket();
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Show notifications with a slight delay for animation
    liveNotifications.forEach(n => {
      setTimeout(() => {
        setVisible(prev => new Set(prev).add(n.streamId));
      }, 100);
    });
  }, [liveNotifications]);

  const handleDismiss = (streamId: string) => {
    setVisible(prev => {
      const newSet = new Set(prev);
      newSet.delete(streamId);
      return newSet;
    });
    setTimeout(() => dismissLiveNotification(streamId), 300);
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {liveNotifications.map((notification) => (
        <div
          key={notification.streamId}
          className={`transform transition-all duration-300 ${
            visible.has(notification.streamId)
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
          }`}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {notification.hostName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                    {notification.title}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href="/live"
                      className="flex-1 text-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:shadow-md transition-shadow"
                      onClick={() => handleDismiss(notification.streamId)}
                    >
                      Watch Now
                    </Link>
                    <button
                      onClick={() => handleDismiss(notification.streamId)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDismiss(notification.streamId)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
