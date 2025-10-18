// 📍 PASTE YOUR SINGLE REEL VIEW CODE HERE
// Single reel view page

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReelCard } from "@/components/reels/ReelCard";
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

export default function SingleReelPage() {
  const params = useParams();
  const router = useRouter();
  const [reel, setReel] = useState<Reel | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reelId = params.id as string;

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

  useEffect(() => {
    const fetchReel = async () => {
      try {
        const response = await fetch(`/api/reels/${reelId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Reel not found");
          } else {
            throw new Error("Failed to fetch reel");
          }
          return;
        }

        const data = await response.json();
        setReel(data.reel);
      } catch (error) {
        console.error("Error fetching reel:", error);
        setError("Failed to load reel");
      } finally {
        setIsLoading(false);
      }
    };

    if (reelId) {
      fetchReel();
    }
  }, [reelId]);

  const handleLike = async (id: string) => {
    try {
      const response = await fetch(`/api/reels/${id}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to like reel");
      }

      const data = await response.json();

      if (reel) {
        setReel({
          ...reel,
          isLiked: data.liked,
          likesCount: data.likesCount,
        });
      }
    } catch (error) {
      console.error("Error liking reel:", error);
      toast.error("Failed to like reel. Please try again.");
    }
  };

  const handleComment = async (id: string, text: string) => {
    try {
      const response = await fetch("/api/reels/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reelId: id, text }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();

      if (reel) {
        setReel({
          ...reel,
          comments: [...reel.comments, data.comment],
          commentsCount: reel.commentsCount + 1,
        });
      }

      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment. Please try again.");
    }
  };

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/reels/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/reels/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reel");
      }

      toast.success("Reel deleted successfully!");
      
      // Redirect to reels feed after a short delay
      setTimeout(() => {
        router.push("/reels");
      }, 1000);

    } catch (error) {
      console.error("Error deleting reel:", error);
      toast.error("Failed to delete reel. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading reel...</p>
        </div>
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <button
            onClick={() => router.back()}
            className="mb-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold mb-4">Reel Not Found</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Reel Content */}
        <div className="h-screen flex items-center justify-center">
          <div className="w-full max-w-sm mx-auto h-full">
            <ReelCard
              reel={reel}
              isActive={true}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onDelete={handleDelete}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
