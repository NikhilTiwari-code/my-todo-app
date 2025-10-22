import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Notification from "@/models/notification.model";
// Ensure referenced models are registered for population
import "@/models/post.model";
import "@/models/reel.models";
import "@/models/story.models";
import "@/models/comment.model";
import { getServerSession } from "@/utils/auth";
import { cache, cacheKeys } from "@/lib/redis";

/**
 * GET /api/notifications
 * Fetch user's notifications with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please login" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    await connectToDb();

    // Build query
    const query: any = { recipient: session.user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Try to get from cache first (only for page 1 and all notifications)
    const cacheKey = cacheKeys.notifications(session.user.id);
    if (page === 1 && !unreadOnly) {
      const cachedData = await cache.get<any>(cacheKey);
      if (cachedData) {
        console.log("✅ Returning notifications from cache");
        return NextResponse.json(cachedData);
      }
    }

    // Fetch notifications with populated data
    const notifications = await Notification.find(query)
      .populate("sender", "name avatar isVerified") // Get sender details
      .populate("post", "imageUrl caption")
      .populate("reel", "videoUrl thumbnail")
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: session.user.id,
      isRead: false,
    });

    const responseData = {
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    };

    // Cache first page for 2 minutes
    if (page === 1 && !unreadOnly) {
      await cache.set(cacheKey, responseData, 120);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch notifications" } },
      { status: 500 }
    );
  }
}
