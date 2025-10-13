import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Conversation from "@/models/conversation.models";
import Message from "@/models/message.models";
import { getServerSession } from "@/utils/auth";

// GET /api/conversations/[userId] - Get or create conversation with specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    await connectToDb();

    // Find or create conversation
    const conversation = await (Conversation as any).findOrCreate(
      session.user.id,
      userId
    );

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
