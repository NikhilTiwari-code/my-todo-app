// 📍 PASTE YOUR VIDEO PLAYER HOOK HERE
// Custom hook for video player logic

"use client";

import { useState, useRef, useCallback } from "react";

interface UseVideoPlayerOptions {
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function useVideoPlayer(options: UseVideoPlayerOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.play().then(() => {
        setIsPlaying(true);
        options.onPlay?.();
      }).catch((error) => {
        console.error("Failed to play video:", error);
      });
    }
  }, [options]);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      setIsPlaying(false);
      options.onPause?.();
    }
  }, [options]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolumeLevel = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      const newMuted = !isMuted;
      video.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) {
        setVolume(video.volume);
      }
    }
  }, [isMuted]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setIsLoading(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      const newTime = video.currentTime;
      setCurrentTime(newTime);
      options.onTimeUpdate?.(newTime, duration);
    }
  }, [duration, options]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    options.onEnd?.();
  }, [options]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const restart = useCallback(() => {
    seek(0);
    play();
  }, [seek, play]);

  const getProgress = useCallback(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  return {
    // Refs
    videoRef,

    // State
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    progress: getProgress(),

    // Actions
    play,
    pause,
    togglePlayPause,
    seek,
    setVolumeLevel,
    toggleMute,
    restart,

    // Event handlers
    handleLoadedMetadata,
    handleTimeUpdate,
    handleEnded,
    handleLoadStart,
    handleCanPlay,
  };
}
