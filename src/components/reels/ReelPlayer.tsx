// 📍 PASTE YOUR REEL PLAYER COMPONENT HERE
// Video player with controls

"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface ReelPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  isActive: boolean; // Whether this reel is currently visible/active
  onVideoEnd?: () => void;
  onVideoStart?: () => void;
}

export function ReelPlayer({
  videoUrl,
  thumbnailUrl,
  isActive,
  onVideoEnd,
  onVideoStart,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);

  // Handle video play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      // Autoplay when reel becomes active
      video.play().catch(() => {
        // Autoplay failed, user interaction required
        setIsPlaying(false);
      });
      setIsPlaying(true);
      onVideoStart?.();
    } else {
      // Pause when reel becomes inactive
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, onVideoStart]);

  // Handle video events
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onVideoEnd?.();
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering video click
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !isMuted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't toggle play if clicking on controls
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    handlePlayPause();
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  return (
    <div
      className="relative w-full h-full bg-black"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleVideoClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        loop={false}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-4">
            <Play className="w-12 h-12 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {(showControls || !isPlaying) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          {/* Progress Bar */}
          <div className="w-full bg-white/30 rounded-full h-1 mb-4">
            <div
              className="bg-white h-1 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleMuteToggle}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
