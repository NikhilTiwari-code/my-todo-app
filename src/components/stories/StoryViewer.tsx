"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import NextImage from "next/image";
import { UserAvatar } from "@/components/users/UserAvatar";

interface Story {
  _id: string;
  userId: any;
  content?: string;
  imageUrl?: string;
  type: "text" | "image" | "both";
  views: any[];
  createdAt: string;
  hasViewed?: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentStory = stories[currentIndex];
  const duration = 5000; // 5 seconds per story

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.hasViewed) {
      fetch(`/api/stories/${currentStory._id}/view`, {
        method: "POST",
        credentials: "include",
      }).catch(err => console.error("Failed to mark as viewed:", err));
    }
  }, [currentStory]);

  // Progress bar animation
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (100 / duration) * 50; // Update every 50ms
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length, duration, onClose]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 3;
    
    if (isLeft && currentIndex > 0) {
      handlePrevious();
    } else if (!isLeft) {
      handleNext();
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <UserAvatar
            avatar={currentStory.userId.avatar}
            name={currentStory.userId.name}
            size="sm"
          />
          <div>
            <p className="text-white font-semibold">{currentStory.userId.name}</p>
            <p className="text-white text-xs opacity-75">
              {new Date(currentStory.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Story Content */}
      <div
        className="relative w-full h-full max-w-md"
        onClick={handleTap}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Image */}
        {currentStory.imageUrl && (
          <div className="absolute inset-0">
            <NextImage
              src={currentStory.imageUrl}
              alt="Story"
              fill
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        )}

        {/* Text Overlay */}
        {currentStory.content && (
          <div className={`absolute inset-0 flex items-center justify-center p-8 ${!currentStory.imageUrl ? 'bg-gradient-to-br from-purple-500 to-blue-600' : ''}`}>
            <p className={`text-2xl font-bold text-center ${currentStory.imageUrl ? 'bg-black bg-opacity-50 p-4 rounded-lg' : ''} text-white`}>
              {currentStory.content}
            </p>
          </div>
        )}

        {/* Navigation Arrows (Desktop) */}
        <div className="hidden md:block">
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* View Count */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <p className="text-white text-sm opacity-75">
          👁️ {currentStory.views.length} {currentStory.views.length === 1 ? 'view' : 'views'}
        </p>
      </div>
    </div>
  );
}
