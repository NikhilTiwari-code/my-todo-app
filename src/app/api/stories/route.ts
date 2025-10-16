import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Story from "@/models/story.models";
import User from "@/models/user.models";
import { getServerSession } from "@/utils/auth";

// GET /api/stories - Get all active stories from friends
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();

    // Get current user with following list
    const currentUser = await User.findById(session.user.id).select("following");
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get active stories from followed users + own stories
    const userIds = [...currentUser.following, session.user.id];
    
    const stories = await Story.find({
      userId: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email avatar")
      .populate("views.userId", "name avatar")
      .lean();

    // Group stories by user
    const groupedStories: { [key: string]: any } = {};
    
    stories.forEach((story: any) => {
      const userId = story.userId._id.toString();
      
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: story.userId,
          stories: [],
          hasViewed: false,
        };
      }
      
      // Check if current user has viewed this story
      const hasViewed = story.views.some(
        (v: any) => v.userId._id.toString() === session.user.id
      );
      
      groupedStories[userId].stories.push({
        ...story,
        hasViewed,
      });
      
      // Mark user as having unviewed stories if any story is not viewed
      if (!hasViewed) {
        groupedStories[userId].hasViewed = false;
      }
    });

    // Convert to array
    const result = Object.values(groupedStories);

    return NextResponse.json({ stories: result });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

// POST /api/stories - Create a new story
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, imageUrl, type } = await request.json();

    // Validation
    if (!type || !["text", "image", "both"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid story type" },
        { status: 400 }
      );
    }

    if (type === "text" && !content) {
      return NextResponse.json(
        { error: "Text content is required for text stories" },
        { status: 400 }
      );
    }

    if ((type === "image" || type === "both") && !imageUrl) {
      return NextResponse.json(
        { error: "Image is required for image stories" },
        { status: 400 }
      );
    }

    await connectToDb();

    // Create story with 24-hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      userId: session.user.id,
      content,
      imageUrl,
      type,
      expiresAt,
      views: [],
    });

    // Populate user info
    await story.populate("userId", "name email avatar");

    // Get user's followers to notify them
    const user = await User.findById(session.user.id).select("followers");
    const followers = user?.followers || [];

    return NextResponse.json(
      {
        message: "Story created successfully",
        story,
        followers: followers.map((f: any) => f.toString()), // Send follower IDs for socket notification
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}
