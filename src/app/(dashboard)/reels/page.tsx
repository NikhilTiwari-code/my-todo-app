// 📍 PASTE YOUR FEED CODE HERE
// This is the main Reels feed page (like TikTok/Instagram Reels)
// Vertical swipeable feed with autoplay

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ReelCard } from "@/components/reels/ReelCard";
import { Upload } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  avatar?: string;
  username?: string;
}

interface Reel {
  _id: string;
  user: User;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  views: number;
  likes: User[];
  likesCount: number;
  comments: any[];
  commentsCount: number;
  hashtags: string[];
  music?: string;
  isLiked: boolean;
  createdAt: string;
}

export default function ReelsPage() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Fetch reels from API
  const fetchReels = useCallback(async (cursor?: string) => {
    try {
      const url = cursor
        ? `/api/reels?cursor=${cursor}&limit=5`
        : "/api/reels?limit=5";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch reels");
      }

      const data = await response.json();

      if (cursor) {
        setReels(prev => [...prev, ...data.reels]);
      } else {
        setReels(data.reels);
      }

      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Error fetching reels:", error);
      toast.error("Failed to load reels. Please try again.");
    }
  }, []);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData._id);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Initial load
  useEffect(() => {
    fetchReels();
    setIsLoading(false);
  }, []);

  // Handle video end - move to next reel
  const handleVideoEnd = useCallback(() => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (hasMore && nextCursor) {
      // Load more reels
      fetchReels(nextCursor);
    }
  }, [currentIndex, reels.length, hasMore, nextCursor, fetchReels]);

  // Handle like action
  const handleLike = async (reelId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to like reel");
      }

      const data = await response.json();

      // Update local state
      setReels(prev => prev.map(reel =>
        reel._id === reelId
          ? {
              ...reel,
              isLiked: data.liked,
              likesCount: data.likesCount,
              likes: data.liked
                ? [...reel.likes, { _id: "currentUser", name: "You" }] // Simplified
                : reel.likes.filter(like => like._id !== "currentUser")
            }
          : reel
      ));

    } catch (error) {
      console.error("Error liking reel:", error);
      toast.error("Failed to like reel. Please try again.");
    }
  };

  // Handle comment action
  const handleComment = async (reelId: string, text: string) => {
    try {
      const response = await fetch("/api/reels/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reelId, text }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();

      // Update local state
      setReels(prev => prev.map(reel =>
        reel._id === reelId
          ? {
              ...reel,
              comments: [...reel.comments, data.comment],
              commentsCount: reel.commentsCount + 1,
            }
          : reel
      ));

      toast.success("Comment added successfully!");

    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.");
    }
  };

  // Handle share action
  const handleShare = (reelId: string) => {
    const url = `${window.location.origin}/reels/${reelId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  // Handle delete action
  const handleDelete = async (reelId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reel");
      }

      // Remove from local state
      setReels(prev => prev.filter(reel => reel._id !== reelId));
      
      toast.success("Reel deleted successfully!");

    } catch (error) {
      console.error("Error deleting reel:", error);
      toast.error("Failed to delete reel. Please try again.");
    }
  };

  // Handle scroll to change active reel
  useEffect(() => {
    const handleScroll = () => {
      const reelHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const newIndex = Math.round(scrollY / reelHeight);
      setCurrentIndex(Math.min(newIndex, reels.length - 1));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reels.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <>
        <Toaster position="top-center" />
        
        {/* Floating Upload Button */}
        <button
          onClick={() => router.push("/reels/upload")}
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          title="Upload Reel"
        >
          <Upload className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="w-full max-w-[500px] mx-auto text-center">
            <p className="text-gray-400 mb-4">No reels available</p>
            <p className="text-sm text-gray-500">Be the first to create a reel!</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      
      {/* Floating Upload Button */}
      <button
        onClick={() => router.push("/reels/upload")}
        className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
        title="Upload Reel"
      >
        <Upload className="w-6 h-6" />
      </button>

      {/* Mobile-sized container (Instagram/TikTok style) */}
      <div className="snap-y snap-mandatory h-screen overflow-y-scroll scrollbar-hide bg-black">
        {reels.map((reel, index) => (
        <div
          key={reel._id}
          className="snap-start snap-always h-screen w-full flex items-center justify-center"
        >
          {/* Mobile width container - max 500px */}
          <div className="w-full h-full max-w-[500px] mx-auto relative bg-black">
            <ReelCard
              reel={reel}
              isActive={index === currentIndex}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onDelete={handleDelete}
              currentUserId={currentUserId}
              onVideoEnd={index === currentIndex ? handleVideoEnd : undefined}
            />
          </div>
        </div>
        ))}

        {/* Loading indicator for more reels */}
        {hasMore && (
          <div className="snap-start h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading more reels...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
