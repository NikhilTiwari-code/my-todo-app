// 🔖 Saved Post Model - User's saved/bookmarked posts
// Allows users to save posts for later

import mongoose, { Schema, Document } from "mongoose";

export interface ISavedPost extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  createdAt: Date;
}

// TODO: Add full schema implementation here
