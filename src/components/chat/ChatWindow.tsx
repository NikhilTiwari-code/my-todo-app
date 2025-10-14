"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { UserAvatar } from "@/components/users/UserAvatar";
import { VideoCall } from "@/components/video/VideoCall";
import { IncomingCallNotification } from "@/components/video/IncomingCallNotification";
import { Send, Loader2, Video, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
  };
  createdAt: string;
  isRead: boolean;
  isDelivered?: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ChatWindowProps {
  conversationId: string;
  otherUser: User;
  currentUserId: string;
}

export function ChatWindow({
  conversationId,
  otherUser,
  currentUserId,
}: ChatWindowProps) {
  const { socket, isConnected, onlineUsers } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Video call states
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [callOtherUser, setCallOtherUser] = useState<typeof otherUser | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOnline = onlineUsers.has(otherUser._id);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        const data = await res.json();
        setMessages(data.messages || []);
        setIsLoading(false);

        // Mark messages as read
        await fetch(`/api/messages/${conversationId}`, {
          method: "PATCH",
        });
      } catch (error) {
        console.error("Error loading messages:", error);
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Receive new messages
    const handleMessageReceive = (message: Message) => {
      console.log("📩 Message received via socket:", message);
      
      // Check if this message belongs to the current conversation
      // Message is for this chat if: sender is otherUser OR receiver is otherUser
      const isSenderOtherUser = typeof message.sender === 'object' 
        ? message.sender._id === otherUser._id 
        : message.sender === otherUser._id;
      
      const isReceiverOtherUser = typeof message.receiver === 'object'
        ? message.receiver._id === otherUser._id
        : message.receiver === otherUser._id;
      
      if (isSenderOtherUser || isReceiverOtherUser) {
        setMessages((prev) => {
          // Prevent duplicate messages
          const messageExists = prev.some(m => m._id === message._id);
          if (messageExists) {
            console.log("⚠️ Duplicate message prevented");
            return prev;
          }
          console.log("✅ Message added to chat");
          return [...prev, message];
        });

        // Mark as read if message is from other user
        if (isSenderOtherUser) {
          fetch(`/api/messages/${conversationId}`, {
            method: "PATCH",
          }).catch(err => console.error("Failed to mark as read:", err));
        }
      }
    };

    socket.on("message:receive", handleMessageReceive);

    // Typing indicators
    socket.on("typing:start", ({ userId }) => {
      if (userId === otherUser._id) {
        setIsTyping(true);
      }
    });

    socket.on("typing:stop", ({ userId }) => {
      if (userId === otherUser._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("message:receive", handleMessageReceive);
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [socket, conversationId, otherUser._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket) return;

    socket.emit("typing:start", { receiverId: otherUser._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (!socket) return;
      socket.emit("typing:stop", { receiverId: otherUser._id });
    }, 3000);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      console.log("📤 Sending message to:", otherUser._id);
      
      // Save to database
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          receiverId: otherUser._id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const message = await res.json();
      console.log("✅ Message saved to DB:", message._id);

      // Add to local state immediately (optimistic update)
      setMessages((prev) => {
        // Prevent duplicates
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });

      // Emit via socket to receiver
      if (socket && isConnected) {
        console.log("📡 Emitting message via socket");
        socket.emit("message:send", {
          receiverId: otherUser._id,
          message,
        });
      } else {
        console.warn("⚠️ Socket not connected, message saved but not sent in real-time");
      }

      // Stop typing indicator
      if (socket && isConnected) {
        socket.emit("typing:stop", { receiverId: otherUser._id });
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // Restore message on error
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Start video call
  const handleStartVideoCall = () => {
    if (!isOnline) {
      alert(`${otherUser.name} is offline. You can only call when they're online.`);
      return;
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setActiveCallId(callId);
    setIsCallInitiator(true);
    setCallOtherUser(otherUser);
    setIsInCall(true);
  };

  // Accept incoming call
  const handleAcceptCall = (
    callId: string,
    caller: string,
    callerName: string,
    callerAvatar?: string,
    offer?: RTCSessionDescriptionInit
  ) => {
    setActiveCallId(callId);
    setIsCallInitiator(false);
    setCallOtherUser({
      _id: caller,
      name: callerName,
      email: "", // Not needed for call
      avatar: callerAvatar,
    });
    setIsInCall(true);
  };

  // End call
  const handleEndCall = () => {
    setIsInCall(false);
    setActiveCallId(null);
    setIsCallInitiator(false);
    setCallOtherUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Incoming call notification */}
      {!isInCall && <IncomingCallNotification onAccept={handleAcceptCall} />}

      {/* Video call */}
      {isInCall && activeCallId && callOtherUser && (
        <VideoCall
          callId={activeCallId}
          otherUser={callOtherUser}
          isInitiator={isCallInitiator}
          onCallEnd={handleEndCall}
        />
      )}

      {/* Chat interface */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 px-3 sm:px-6 py-3 sm:py-4 text-white">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex-shrink-0">
              <UserAvatar avatar={otherUser.avatar} name={otherUser.name} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-semibold tracking-wide truncate">
                {otherUser.name}
              </h2>
              <p className="mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-white/70">
                {isOnline ? (
                  <>
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)] flex-shrink-0"></span>
                    <span className="uppercase tracking-widest text-emerald-300 truncate hidden sm:inline">Active now</span>
                    <span className="uppercase tracking-widest text-emerald-300 truncate sm:hidden">Active</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white/40 flex-shrink-0"></span>
                    <span className="uppercase tracking-widest text-white/50 truncate hidden sm:inline">Offline - they will see it later</span>
                    <span className="uppercase tracking-widest text-white/50 truncate sm:hidden">Offline</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Audio call button */}
            <button
              type="button"
              onClick={handleStartVideoCall}
              disabled={!isOnline}
              className={`rounded-full p-2 sm:px-4 sm:py-2 text-white transition ${
                isOnline
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-white/5 cursor-not-allowed opacity-50"
              }`}
              aria-label="Audio call"
              title={isOnline ? "Start audio call" : "User is offline"}
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Video call button */}
            <button
              type="button"
              onClick={handleStartVideoCall}
              disabled={!isOnline}
              className={`rounded-full p-2 sm:px-4 sm:py-2 text-white transition ${
                isOnline
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-white/5 cursor-not-allowed opacity-50"
              }`}
              aria-label="Video call"
              title={isOnline ? "Start video call" : "User is offline"}
            >
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]" />
        <div className="relative h-full overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-white/70 px-4">
              <p className="text-sm sm:text-base">No messages yet. Say hi and break the ice.</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender._id === currentUserId;
              const statusLabel = message.isRead
                ? "Read"
                : message.isDelivered
                ? "Delivered"
                : "Sent";

              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[85%] sm:max-w-[70%] flex-col gap-2 sm:gap-3 ${
                      isOwn ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`flex items-end gap-2 sm:gap-3 ${
                        isOwn ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {!isOwn && (
                        <div className="flex-shrink-0">
                          <UserAvatar
                            avatar={message.sender.avatar}
                            name={message.sender.name}
                            size="sm"
                          />
                        </div>
                      )}
                      <div
                        className={`w-fit rounded-2xl sm:rounded-3xl px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm leading-relaxed shadow-[0_18px_40px_-18px_rgba(79,70,229,0.55)] ${
                          isOwn
                            ? "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 text-white"
                            : "border border-white/15 bg-white/10 text-white backdrop-blur"
                        }`}
                      >
                        <p className="whitespace-pre-line break-words">{message.content}</p>
                      </div>
                    </div>
                    <p
                      className={`text-[10px] sm:text-xs uppercase tracking-widest text-white/50 px-1 ${
                        isOwn ? "text-right" : "text-left"
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                      {isOwn && <span className="ml-2 sm:ml-3 text-white/60">{statusLabel}</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/70">
              <div className="flex-shrink-0">
                <UserAvatar avatar={otherUser.avatar} name={otherUser.name} size="sm" />
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="uppercase tracking-widest text-[10px] sm:text-xs">Typing</span>
                  <div className="flex items-end gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-white/10 bg-slate-950/80 px-3 sm:px-6 py-3 sm:py-5 backdrop-blur"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 sm:px-5 sm:py-3 transition focus-within:border-fuchsia-400 focus-within:bg-white/10">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Message..."
              disabled={isSending}
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 text-white shadow-[0_18px_40px_-18px_rgba(236,72,153,0.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
        {!isConnected && (
          <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs uppercase tracking-widest text-amber-300">
            Disconnected. Reconnecting...
          </p>
        )}
      </form>
      </div>
    </>
  );
}
