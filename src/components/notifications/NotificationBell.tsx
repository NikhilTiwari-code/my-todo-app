"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationDropdown } from "./NotificationDropdown";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial unread count
    fetchUnreadCount();

    // Listen for real-time count updates
    if (socket && isConnected) {
      socket.on("notification:count", (count: number) => {
        console.log("📊 Received unread count update:", count);
        setUnreadCount(count);
        setHasNewNotification(true);
        setTimeout(() => setHasNewNotification(false), 3000);
      });

      socket.on("notification", (notification: any) => {
        console.log("🔔 New notification received:", notification);
        setUnreadCount((prev) => prev + 1);
        setHasNewNotification(true);
        setTimeout(() => setHasNewNotification(false), 3000);
      });
    }

    return () => {
      socket?.off("notification:count");
      socket?.off("notification");
    };
  }, [socket, isConnected, user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications?unreadOnly=true", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell
          size={24}
          className={`text-gray-700 dark:text-gray-200 ${
            hasNewNotification ? "animate-bounce" : ""
          }`}
        />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* New notification indicator pulse */}
        {hasNewNotification && (
          <span className="absolute -top-1 -right-1 w-5 h-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <NotificationDropdown
            onClose={() => setIsOpen(false)}
            onMarkAllRead={handleMarkAllRead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
