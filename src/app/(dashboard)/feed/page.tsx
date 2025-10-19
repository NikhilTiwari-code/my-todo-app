// src/app/(dashboard)/feed/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/feed/PostCard";
import CreatePost from "@/components/feed/CreatePost";
import { Loader2, Plus } from "lucide-react";

// Force dynamic rendering to avoid SSR issues with InfiniteScroll
export const dynamic = 'force-dynamic';

// Dynamically import InfiniteScroll with ssr disabled to avoid 'self' error
const InfiniteScroll = dynamic(
  () => import("react-infinite-scroll-component"),
  { 
    ssr: false,
  }
) as any;

interface Post {
  _id: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  images: string[];
  caption?: string;
  location?: {
    name: string;
  };
  likes: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial posts
  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      fetchPosts(1);
    }
  }, [user, authLoading, fetchPosts]);

  // Load more posts
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  // Handle like toggle
  const handleLikeToggle = async (postId: string, isLiked: boolean, likeCount: number) => {
    // Optimistically update UI
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, isLiked, likeCount }
          : post
      )
    );

    // Call API
    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to like post:", error);
      // Revert on error
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, isLiked: !isLiked, likeCount: isLiked ? likeCount - 1 : likeCount + 1 }
            : post
        )
      );
    }
  };

  // Handle save toggle
  const handleSaveToggle = async (postId: string, isSaved: boolean) => {
    // Optimistically update UI
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, isSaved }
          : post
      )
    );

    // Call API
    try {
      await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to save post:", error);
      // Revert on error
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, isSaved: !isSaved }
            : post
        )
      );
    }
  };

  // Handle delete post
  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setPosts((prev) => prev.filter((post) => post._id !== postId));
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  // Handle comment added
  const handleCommentAdded = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, commentCount: post.commentCount + 1 }
          : post
      )
    );
  };

  // Handle new post created
  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setShowCreatePost(false);
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Feed</h1>
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <Plus className="w-5 h-5" />
            Create Post
          </button>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-2xl mx-auto py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">
              No posts yet. Follow users to see their posts!
            </p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Create Your First Post
            </button>
          </div>
        ) : mounted ? (
          <InfiniteScroll
            dataLength={posts.length}
            next={loadMore}
            hasMore={hasMore}
            loader={
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            }
            endMessage={
              <p className="text-center text-gray-500 py-4">
                You&apos;re all caught up! 🎉
              </p>
            }
          >
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user.id}
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onDelete={handleDelete}
                  onCommentAdded={handleCommentAdded}
                />
              ))}
            </div>
          </InfiniteScroll>
        ) : (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
