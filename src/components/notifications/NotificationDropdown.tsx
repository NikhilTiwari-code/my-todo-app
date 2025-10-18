"use client";

import { useState, useEffect, useRef } from "react";
import { NotificationItem } from "./NotificationItem";
import { useSocket } from "@/contexts/SocketContext";
import { X, CheckCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface NotificationDropdownProps {
  onClose: () => void;
  onMarkAllRead: () => void;
}

export function NotificationDropdown({ onClose, onMarkAllRead }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const { socket, isConnected } = useSocket();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Listen for new notifications
    if (socket && isConnected) {
      socket.on("notification", (newNotification: any) => {
        console.log("🔔 New notification in dropdown:", newNotification);
        setNotifications((prev) => [newNotification, ...prev]);
      });
    }

    // Close on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socket?.off("notification");
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [socket, isConnected]);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=15`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setNotifications(data.data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.data.notifications]);
        }
        setHasMore(data.data.pagination.page < data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ markAllRead: true }),
      });
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      onMarkAllRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-14 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Notifications</h3>
        <div className="flex gap-2">
          <button
            onClick={handleMarkAllRead}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1"
            title="Mark all as read"
          >
            <CheckCheck size={16} />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                🔔
              </motion.div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No notifications yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              You'll see notifications here when someone interacts with your content
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onRead={() => {
                  setNotifications((prev) =>
                    prev.map((n) =>
                      n._id === notification._id ? { ...n, isRead: true } : n
                    )
                  );
                }}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
