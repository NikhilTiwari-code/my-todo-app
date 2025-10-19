"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Phone, PhoneOff, Video } from "lucide-react";
import { UserAvatar } from "@/components/users/UserAvatar";

interface IncomingCall {
  callId: string;
  caller: string;
  callerName: string;
  callerAvatar?: string;
  offer: RTCSessionDescriptionInit;
}

interface IncomingCallNotificationProps {
  onAccept: (callId: string, caller: string, callerName: string, callerAvatar?: string, offer?: RTCSessionDescriptionInit) => void;
}

export function IncomingCallNotification({
  onAccept,
}: IncomingCallNotificationProps) {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming calls
    socket.on("call:incoming", ({ callId, caller, offer }: any) => {
      console.log("📞 Incoming call from:", caller);
      
      // Fetch caller details
      fetch(`/api/users/${caller}`)
        .then((res) => res.json())
        .then((userData) => {
          setIncomingCall({
            callId,
            caller,
            callerName: userData.name || "Unknown",
            callerAvatar: userData.avatar,
            offer,
          });

          // Play ringtone (optional)
          const audio = new Audio("/ringtone.mp3");
          audio.loop = true;
          audio.play().catch(() => console.log("Could not play ringtone"));

          // Stop ringtone after 30 seconds or when call is answered/rejected
          const timeout = setTimeout(() => {
            audio.pause();
            setIncomingCall(null);
          }, 30000);

          return () => {
            audio.pause();
            clearTimeout(timeout);
          };
        })
        .catch((err) => {
          console.error("Error fetching caller details:", err);
        });
    });

    // Call ended by caller before answer
    socket.on("call:ended", ({ callId: endedCallId }: any) => {
      if (incomingCall && incomingCall.callId === endedCallId) {
        setIncomingCall(null);
      }
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:ended");
    };
  }, [socket, incomingCall]);

  const handleAccept = () => {
    if (incomingCall) {
      onAccept(
        incomingCall.callId,
        incomingCall.caller,
        incomingCall.callerName,
        incomingCall.callerAvatar,
        incomingCall.offer
      );
      setIncomingCall(null);
    }
  };

  const handleReject = () => {
    if (socket && incomingCall) {
      socket.emit("call:reject", { callId: incomingCall.callId });
      setIncomingCall(null);
    }
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Caller avatar */}
          <div className="mb-4 sm:mb-6 animate-pulse">
            <UserAvatar
              avatar={incomingCall.callerAvatar}
              name={incomingCall.callerName}
              size="xl"
            />
          </div>

          {/* Caller name */}
          <h2 className="mb-2 text-xl sm:text-2xl font-bold text-white">
            {incomingCall.callerName}
          </h2>
          <p className="mb-6 sm:mb-8 flex items-center gap-2 text-sm sm:text-base text-white/80">
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            Incoming video call...
          </p>

          {/* Action buttons */}
          <div className="flex w-full gap-3 sm:gap-4">
            {/* Reject */}
            <button
              onClick={handleReject}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold text-white transition-all hover:bg-red-600 hover:scale-105 active:scale-95"
            >
              <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Decline</span>
              <span className="sm:hidden">✕</span>
            </button>

            {/* Accept */}
            <button
              onClick={handleAccept}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-semibold text-white transition-all hover:bg-green-600 hover:scale-105 animate-pulse active:scale-95"
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Accept</span>
              <span className="sm:hidden">✓</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
