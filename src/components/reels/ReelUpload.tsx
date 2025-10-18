// 📍 PASTE YOUR REEL UPLOAD COMPONENT HERE
// Upload form component

"use client";

import { useState, useRef } from "react";
import { Upload, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import toast from "react-hot-toast";

interface ReelUploadProps {
  onUpload: (data: {
    videoUrl: string;
    thumbnailUrl: string;
    caption: string;
    duration: number;
    cloudinaryPublicId: string;
  }) => void;
  onCancel: () => void;
}

export function ReelUpload({ onUpload, onCancel }: ReelUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be less than 100MB");
      return;
    }

    setSelectedFile(file);
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);
  };

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);

      // Validate duration (1-60 seconds)
      if (video.duration < 1 || video.duration > 60) {
        toast.error("Video must be between 1 and 60 seconds long");
        handleRemoveVideo();
        return;
      }
    }
  };

  const handleRemoveVideo = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    setDuration(0);
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const handleUpload = async () => {
    if (!selectedFile || !videoPreview) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get upload signature from our API
      const signatureResponse = await fetch("/api/reels/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
        }),
      });

      if (!signatureResponse.ok) {
        throw new Error("Failed to get upload signature");
      }

      const signatureData = await signatureResponse.json();

      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", signatureData.folder);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", signatureData.timestamp.toString());
      formData.append("signature", signatureData.signature);

      // Upload to Cloudinary with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`);
        xhr.send(formData);
      });

      const cloudinaryData = await uploadPromise;

      // Generate thumbnail URL
      const thumbnailUrl = `https://res.cloudinary.com/${signatureData.cloudName}/video/upload/w_400,h_711,c_fill,q_auto,f_jpg/${cloudinaryData.public_id}.jpg`;

      // Call onUpload with the data
      onUpload({
        videoUrl: cloudinaryData.secure_url,
        thumbnailUrl,
        caption: caption.trim(),
        duration: Math.round(duration),
        cloudinaryPublicId: cloudinaryData.public_id,
      });

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Create Reel</h2>

        {/* File Upload Area */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Select video to upload</p>
            <p className="text-sm text-gray-500">
              MP4, MOV, AVI up to 100MB, 1-60 seconds
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="relative">
              <video
                ref={videoRef}
                src={videoPreview || undefined}
                className="w-full rounded-lg"
                onLoadedMetadata={handleVideoLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                muted
              />
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors rounded-lg"
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white" />
                )}
              </button>
              <button
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Info */}
            <div className="text-sm text-gray-600">
              Duration: {duration.toFixed(1)}s
            </div>

            {/* Caption Input */}
            <div>
              <Textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                className="resize-none"
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {caption.length}/2200
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            className="flex-1"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Post Reel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
