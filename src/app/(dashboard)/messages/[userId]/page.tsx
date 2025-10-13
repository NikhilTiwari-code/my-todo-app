import { ChatWindow } from "@/components/chat/ChatWindow";
import { getServerSession } from "@/utils/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  const conversation = await (Conversation as any).findOrCreate(
    session.user.id,
    userId
  );

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-8rem)]">
      <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Back button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            href="/messages"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to messages
          </Link>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            conversationId={conversation._id.toString()}
            otherUser={{
              _id: otherUser._id.toString(),
              name: otherUser.name,
              email: otherUser.email,
              avatar: otherUser.avatar,
            }}
            currentUserId={session.user.id}
          />
        </div>
      </div>
    </div>
  );
}
