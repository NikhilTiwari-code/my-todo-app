import { ChatWindow } from "@/components/chat/ChatWindow";
import { getServerSession } from "@/utils/auth";
import { redirect } from "next/navigation";

import User from "@/models/user.models";
import Conversation from "@/models/conversation.models";
import connectToDb from "@/utils/db";

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function ChatPage({ params }: PageProps) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const { userId } = await params;

  await connectToDb();

  // Get other user details
  const otherUser = await User.findById(userId).select("name email avatar").lean();
  if (!otherUser) {
    redirect("/messages");
  }

  // Get or create conversation
  const conversation = await Conversation.findOrCreate(
    session.user.id,
    userId
  );

  return (
    // Full page chat - no padding, no container
    <div className="fixed inset-0 z-50 bg-slate-950">
      <ChatWindow
        conversationId={String(conversation._id)}
        otherUser={{
          _id: otherUser._id.toString(),
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar,
        }}
        currentUserId={session.user.id}
      />
    </div>
  );
}
