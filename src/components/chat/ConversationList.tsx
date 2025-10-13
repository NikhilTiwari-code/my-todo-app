"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/users/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageCircle } from "lucide-react";

interface Conversation {
  _id: string;
  otherUser: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        setConversations(data);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No conversations yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Start chatting with your friends to see conversations here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {conversations.map((conversation) => (
        <Link
          key={conversation._id}
          href={`/messages/${conversation.otherUser._id}`}
          className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <UserAvatar 
            avatar={conversation.otherUser.avatar} 
            name={conversation.otherUser.name} 
            size="md" 
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {conversation.otherUser.name}
              </h3>
              {conversation.lastMessage?.createdAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(
                    new Date(conversation.lastMessage.createdAt),
                    { addSuffix: true }
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {conversation.lastMessage?.content || "Start a conversation"}
              </p>
              {conversation.unreadCount > 0 && (
                <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
