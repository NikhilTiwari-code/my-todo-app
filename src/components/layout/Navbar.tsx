"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { liveNotifications } = useSocket();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isActive = (href: string) => pathname === href;
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">TodoX</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/feed" isActive={isActive("/feed")}>Feed</NavLink>
              <NavLink href="/discover" isActive={isActive("/discover")}>Discover</NavLink>
              <NavLink href="/reels" isActive={isActive("/reels")}>Reels</NavLink>
              <NavLink href="/stories" isActive={isActive("/stories")}>Stories</NavLink>
              <NavLink href="/live" isActive={isActive("/live")}>
                <span className="flex items-center gap-1.5">
                  Live
                  {liveNotifications.length > 0 ? (
                    <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                      {liveNotifications.length}
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </span>
              </NavLink>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link 
              href="/search" 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </Link>
            
            {user && (
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{user.name}</span>
              </Link>
            )}
            
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <nav className="flex flex-col gap-1">
              <MobileNavLink href="/feed" isActive={isActive("/feed")} onClick={() => setIsMobileMenuOpen(false)}>Feed</MobileNavLink>
              <MobileNavLink href="/discover" isActive={isActive("/discover")} onClick={() => setIsMobileMenuOpen(false)}>Discover</MobileNavLink>
              <MobileNavLink href="/reels" isActive={isActive("/reels")} onClick={() => setIsMobileMenuOpen(false)}>Reels</MobileNavLink>
              <MobileNavLink href="/stories" isActive={isActive("/stories")} onClick={() => setIsMobileMenuOpen(false)}>Stories</MobileNavLink>
              <MobileNavLink href="/live" isActive={isActive("/live")} onClick={() => setIsMobileMenuOpen(false)}>
                <span className="flex items-center justify-between w-full">
                  Live
                  {liveNotifications.length > 0 && (
                    <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                      {liveNotifications.length}
                    </span>
                  )}
                </span>
              </MobileNavLink>
              <MobileNavLink href="/search" isActive={isActive("/search")} onClick={() => setIsMobileMenuOpen(false)}>Search</MobileNavLink>
              {user && (
                <MobileNavLink href="/profile" isActive={isActive("/profile")} onClick={() => setIsMobileMenuOpen(false)}>
                  Profile ({user.name})
                </MobileNavLink>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, isActive, children }: { href: string; isActive: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, isActive, onClick, children }: { href: string; isActive: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      {children}
    </Link>
  );
}
