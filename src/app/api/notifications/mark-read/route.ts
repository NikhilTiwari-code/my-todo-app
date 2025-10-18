import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import { getServerSession } from "@/utils/auth";
import { markAsRead, getUnreadCount } from "@/utils/notifications";

/**
 * POST /api/notifications/mark-read
 * Mark notification(s) as read
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please login" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    await connectToDb();

    // Mark notification(s) as read
    const success = await markAsRead(
      session.user.id,
      markAllRead ? undefined : notificationId
    );

    if (!success) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to mark as read" } },
        { status: 500 }
      );
    }

    // Get updated unread count
    const unreadCount = await getUnreadCount(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        message: markAllRead ? "All notifications marked as read" : "Notification marked as read",
        unreadCount,
      },
    });
  } catch (error) {
    console.error("❌ Error marking notifications as read:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to mark as read" } },
      { status: 500 }
    );
  }
}
