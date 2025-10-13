import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Message from "@/models/message.models";
import Conversation from "@/models/conversation.models";
import { getServerSession } from "@/utils/auth";

// GET /api/messages/[conversationId] - Get all messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // Cursor for pagination

    await connectToDb();

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!conversation.participants.includes(session.user.id as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build query
    const query: any = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "name email avatar")
      .populate("receiver", "name email avatar");

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages/[conversationId] - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { content, receiverId, messageType, fileUrl, fileName, fileSize } =
      await request.json();

    await connectToDb();

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!conversation.participants.includes(session.user.id as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: session.user.id,
      receiver: receiverId,
      content,
      messageType: messageType || "text",
      fileUrl,
      fileName,
      fileSize,
      isDelivered: false,
      isRead: false,
    });

    // Update conversation's last message
    conversation.lastMessage = {
      content,
      sender: session.user.id as any,
      createdAt: new Date(),
    };

    // Increment unread count for receiver
    const currentCount = conversation.unreadCount?.get(receiverId) || 0;
    conversation.unreadCount?.set(receiverId, currentCount + 1);

    await conversation.save();

    // Populate sender info
    await message.populate("sender", "name email avatar");

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/[conversationId]/read - Mark messages as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    await connectToDb();

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: session.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Reset unread count in conversation
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.unreadCount?.set(session.user.id, 0);
      await conversation.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
