import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Story from "@/models/story.models";
import { getServerSession } from "@/utils/auth";

// GET /api/stories/[id] - Get a specific story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectToDb();

    const story = await Story.findById(id)
      .populate("userId", "name email avatar")
      .populate("views.userId", "name avatar")
      .lean();

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Check if story is expired
    if (new Date(story.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Story has expired" }, { status: 410 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Error fetching story:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

// POST /api/stories/[id]/view - Mark story as viewed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectToDb();

    const story = await Story.findById(id);

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Check if story is expired
    if (story.expiresAt < new Date()) {
      return NextResponse.json({ error: "Story has expired" }, { status: 410 });
    }

    // Check if user already viewed this story
    const alreadyViewed = story.views.some(
      (v: any) => v.userId.toString() === session.user.id
    );

    if (!alreadyViewed) {
      story.views.push({
        userId: session.user.id as any,
        viewedAt: new Date(),
      });
      await story.save();
    }

    return NextResponse.json({
      message: "Story viewed",
      viewCount: story.views.length,
    });
  } catch (error) {
    console.error("Error marking story as viewed:", error);
    return NextResponse.json(
      { error: "Failed to mark story as viewed" },
      { status: 500 }
    );
  }
}
