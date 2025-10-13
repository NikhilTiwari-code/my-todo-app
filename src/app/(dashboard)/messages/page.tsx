import { ConversationList } from "@/components/chat/ConversationList";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Messages
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ConversationList />
      </div>
    </div>
  );
}
