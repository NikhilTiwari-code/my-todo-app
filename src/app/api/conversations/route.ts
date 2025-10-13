import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Conversation from "@/models/conversation.models";
import { getServerSession } from "@/utils/auth";

// GET /api/conversations - Get all conversations for current user
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();

    const conversations = await Conversation.find({
      participants: session.user.id,
    })
      .populate("participants", "name email avatar")
      .sort({ updatedAt: -1 });

    // Format conversations with unread count for current user
    const formattedConversations = conversations.map((conv: any) => {
      const otherUser = conv.participants.find(
        (p: any) => p._id.toString() !== session.user.id
      );

      return {
        _id: conv._id,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar,
        },
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount?.get(session.user.id) || 0,
        updatedAt: conv.updatedAt,
      };
    });

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
