// 📍 PASTE YOUR REEL MODEL HERE
// MongoDB schema for Reels

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReel extends Document {
  userId: mongoose.Types.ObjectId;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  views: number;
  likes: mongoose.Types.ObjectId[];
  comments: Array<{
    userId: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;
  hashtags: string[];
  music?: string;
  cloudinaryPublicId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Paste your full schema code here
