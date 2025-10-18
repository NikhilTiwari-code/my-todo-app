// 📍 PASTE YOUR API ROUTE CODE HERE
// GET: Fetch all reels (with pagination)
// POST: Create new reel

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Reel from "@/models/reel.models";
import User from "@/models/user.models";
import { getUserIdFromRequest } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    await connectToDb();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const cursor = searchParams.get("cursor"); // For pagination
    
    const authResult = await getUserIdFromRequest(request);
    const userId = "error" in authResult ? null : authResult.userId;

    // Build query
    const query: any = { isActive: true };

    // Add cursor-based pagination
    if (cursor) {
      query._id = { $lt: cursor };
    }

    // Fetch reels with user info
    const reels = await Reel.find(query)
      .populate("userId", "name avatar username")
      .populate("likes", "name avatar username")
      .populate("comments.userId", "name avatar username")
      .sort({ createdAt: -1 })
      .limit(limit + 1); // +1 to check if there are more

    // Check if there are more results
    const hasMore = reels.length > limit;
    const reelsToReturn = hasMore ? reels.slice(0, -1) : reels;

    // Format response
    const formattedReels = reelsToReturn.map((reel: any) => ({
      _id: reel._id,
      user: {
        _id: reel.userId._id,
        name: reel.userId.name,
        avatar: reel.userId.avatar,
        username: reel.userId.username,
      },
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl,
      caption: reel.caption,
      duration: reel.duration,
      views: reel.views,
      likes: reel.likes.map((like: any) => ({
        _id: like._id,
        name: like.name,
        avatar: like.avatar,
        username: like.username,
      })),
      likesCount: reel.likes.length,
      comments: reel.comments.slice(0, 50), // First 50 comments
      commentsCount: reel.comments.length,
      hashtags: reel.hashtags,
      music: reel.music,
      isLiked: userId ? reel.likes.some((like: any) => like._id.toString() === userId.toString()) : false,
      createdAt: reel.createdAt,
    }));

    return NextResponse.json({
      reels: formattedReels,
      hasMore,
      nextCursor: hasMore ? reelsToReturn[reelsToReturn.length - 1]._id : null,
    });

  } catch (error) {
    console.error("GET reels error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDb();

    const authResult = await getUserIdFromRequest(request);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const { videoUrl, thumbnailUrl, caption, duration, cloudinaryPublicId } = await request.json();

    // Validate required fields
    if (!videoUrl || !thumbnailUrl || !duration || !cloudinaryPublicId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate duration (1-60 seconds)
    if (duration < 1 || duration > 60) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 60 seconds" },
        { status: 400 }
      );
    }

    // Create new reel
    const newReel = new Reel({
      userId,
      videoUrl,
      thumbnailUrl,
      caption: caption || "",
      duration,
      cloudinaryPublicId,
      views: 0,
      likes: [],
      comments: [],
      hashtags: [],
      isActive: true,
    });

    await newReel.save();

    // Populate user info for response
    await newReel.populate("userId", "name avatar username");

    // Get followers for real-time notifications (you'll need to implement this)
    // const followers = await getUserFollowers(userId);

    return NextResponse.json({
      reel: {
        _id: newReel._id,
        user: {
          _id: (newReel.userId as any)._id,
          name: (newReel.userId as any).name,
          avatar: (newReel.userId as any).avatar,
          username: (newReel.userId as any).username,
        },
        videoUrl: newReel.videoUrl,
        thumbnailUrl: newReel.thumbnailUrl,
        caption: newReel.caption,
        duration: newReel.duration,
        views: newReel.views,
        likes: [],
        likesCount: 0,
        comments: [],
        commentsCount: 0,
        hashtags: newReel.hashtags,
        createdAt: newReel.createdAt,
      },
      // followers: followers, // For socket notifications
    });

  } catch (error) {
    console.error("POST reel error:", error);
    return NextResponse.json(
      { error: "Failed to create reel" },
      { status: 500 }
    );
  }
}
