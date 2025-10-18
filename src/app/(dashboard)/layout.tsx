"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/users/UserAvatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Todos", href: "/todos", icon: "✓" },
    { name: "Feed", href: "/feed", icon: "📱" },
    { name: "Reels", href: "/reels", icon: "🎬" },
    { name: "Stories", href: "/stories", icon: "📸" },
    { name: "Trending", href: "/trending", icon: "🔥" },
    { name: "Friends", href: "/friends", icon: "👥" },
    { name: "Messages", href: "/messages", icon: "💬" },
    { name: "Profile", href: "/profile", icon: "👤" },
  ];

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="sidebar-overlay md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={cn(
            "sidebar",
            isSidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded",
            isMobileMenuOpen && "sidebar-open"
          )}
        >
          <div className="sidebar-inner">
            {/* Logo & Toggle */}
            <div className="sidebar-header">
              <h1 className="sidebar-logo">
                TodoApp
              </h1>
              <button
                onClick={toggleSidebar}
                className="sidebar-toggle"
                aria-label="Toggle sidebar"
              >
                {isSidebarCollapsed ? (
                  // Menu icon (expand)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                ) : (
                  // Collapse icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                )}
              </button>
            </div>

            {/* User Info */}
            <div className="sidebar-user">
              <div className="sidebar-user-content">
                <div className="sidebar-avatar">
                  <UserAvatar 
                    avatar={user?.avatar} 
                    name={user?.name || "User"} 
                    size="md"
                  />
                </div>
                <div className="sidebar-user-info">
                  <p className="sidebar-user-name">
                    {user?.name || "User"}
                  </p>
                  <p className="sidebar-user-email">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "sidebar-nav-item",
                      isActive
                        ? "sidebar-nav-item-active"
                        : "sidebar-nav-item-inactive"
                    )}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    <span className="sidebar-nav-text">{item.name}</span>
                    {isSidebarCollapsed && (
                      <span className="sidebar-tooltip">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="sidebar-footer">
              <Button
                variant="outline"
                className="sidebar-logout-btn"
                onClick={logout}
                title={isSidebarCollapsed ? "Logout" : undefined}
              >
                {isSidebarCollapsed ? (
                  <span className="text-lg">🚪</span>
                ) : (
                  "Logout"
                )}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main 
          className={cn(
            "main-content",
            isSidebarCollapsed ? "main-content-collapsed" : "main-content-expanded"
          )}
        >
          {/* Top Header with Theme Toggle */}
          <div className="top-header">
            <div className="top-header-content">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              {/* Page Title */}
              <h2 className="top-header-title hidden md:block">
                {navigation.find(item => item.href === pathname)?.name || "Dashboard"}
              </h2>

              {/* Notifications & Theme Toggle */}
              <div className="top-header-actions ml-auto flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
