// src/app/api/posts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Post from "@/models/post.model";
import User from "@/models/user.models";
import { uploadMultipleToCloudinary } from "@/lib/cloudinary";
import { notifyFollowersAboutNewPost } from "@/utils/notifications";
import { notifyMentionedUsers } from "@/utils/mentions";

// GET - Get feed posts
export async function GET(req: NextRequest) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");

    // Get user's following list
    const user = await User.findById(userId).select("following");
    const followingIds = user?.following?.map((id: any) => id.toString()) || [];

    // Get feed posts
    const posts = await Post.getFeed(userId, followingIds, page, limit);

    // Add isLiked and isSaved flags
    const postsWithFlags = posts.map((post: any) => ({
      ...post,
      isLiked: post.likes.some((id: any) => id.toString() === userId),
      isSaved: post.savedBy.some((id: any) => id.toString() === userId),
      likeCount: post.likes.length,
    }));

    return NextResponse.json({
      success: true,
      posts: postsWithFlags,
      page,
      hasMore: posts.length === limit,
    });
  } catch (error: any) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch feed" },
      { status: 500 }
    );
  }
}

// POST - Create new post
export async function POST(req: NextRequest) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const body = await req.json();
    const { images, caption, location } = body;

    // Validate images
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    if (images.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images allowed" },
        { status: 400 }
      );
    }

    // Upload images to Cloudinary
    const uploadedImages = await uploadMultipleToCloudinary(
      images, // Base64 strings
      "instagram/posts"
    );

    const imageUrls = uploadedImages.map((img) => img.secure_url);

    // Create post
    const post = await Post.create({
      userId: userId,
      images: imageUrls,
      caption: caption?.trim() || "",
      location: location || null,
    });

    // Populate user data
    await post.populate("userId", "name username avatar");

    // Notify mentioned users in caption (async, non-blocking)
    if (caption) {
      notifyMentionedUsers(
        caption,
        userId,
        (post as any)._id.toString()
      ).catch(err => {
        console.error("Failed to notify mentioned users:", err);
      });
    }

    // Notify all followers about the new post (async, non-blocking)
    try {
      const postAuthor = await User.findById(userId).select('followers').lean();
      if (postAuthor?.followers && postAuthor.followers.length > 0) {
        const followerIds = postAuthor.followers.map((id: any) => id.toString());
        
        // Send notifications asynchronously (don't block response)
        notifyFollowersAboutNewPost(
          userId,
          (post as any)._id.toString(),
          followerIds,
          caption
        ).catch(err => {
          console.error("Failed to notify followers:", err);
        });
      }
    } catch (notifError) {
      // Notification failure shouldn't affect post creation
      console.error("Error in new post notification flow:", notifError);
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post.toObject(),
        isLiked: false,
        isSaved: false,
        likeCount: 0,
      },
    });
  } catch (error: any) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}