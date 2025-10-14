"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface VideoCallProps {
  callId: string;
  otherUser: {
    _id: string;
    name: string;
    avatar?: string;
  };
  isInitiator: boolean;
  onCallEnd: () => void;
}

export function VideoCall({
  callId,
  otherUser,
  isInitiator,
  onCallEnd,
}: VideoCallProps) {
  const { socket } = useSocket();
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callStatus, setCallStatus] = useState<
    "connecting" | "connected" | "ended"
  >("connecting");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // WebRTC configuration
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize peer connection
        await initializePeerConnection(stream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Could not access camera/microphone. Please check permissions.");
        onCallEnd();
      }
    };

    initializeMedia();

    return () => {
      cleanup();
    };
  }, []);

  // Initialize WebRTC peer connection
  const initializePeerConnection = async (stream: MediaStream) => {
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Add local stream tracks to peer connection
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    // Handle incoming tracks (remote stream)
    peerConnection.ontrack = (event) => {
      console.log("📹 Received remote track:", event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus("connected");
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log("🧊 Sending ICE candidate");
        socket.emit("call:ice-candidate", {
          callId,
          candidate: event.candidate,
          targetUserId: otherUser._id,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      
      if (peerConnection.connectionState === "connected") {
        setCallStatus("connected");
      } else if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed"
      ) {
        handleEndCall();
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socket) {
        console.log("📞 Initiating call with offer");
        socket.emit("call:initiate", {
          receiverId: otherUser._id,
          callId,
          offer,
        });
      }
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket || !peerConnectionRef.current) return;

    // Handle incoming call answer
    socket.on("call:answered", async ({ answer }) => {
      console.log("✅ Call answered");
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    // Handle incoming call (for receiver)
    socket.on("call:incoming", async ({ offer }) => {
      console.log("📞 Incoming call with offer");
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit("call:answer", { callId, answer });
      }
    });

    // Handle ICE candidates
    socket.on("call:ice-candidate", async ({ candidate }) => {
      console.log("🧊 Received ICE candidate");
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    // Handle call ended
    socket.on("call:ended", () => {
      console.log("☎️ Call ended by other party");
      handleEndCall();
    });

    socket.on("call:rejected", () => {
      console.log("❌ Call rejected");
      alert("Call was rejected");
      handleEndCall();
    });

    return () => {
      socket.off("call:answered");
      socket.off("call:incoming");
      socket.off("call:ice-candidate");
      socket.off("call:ended");
      socket.off("call:rejected");
    };
  }, [socket, callId, otherUser._id]);

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing, switch back to camera
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }

        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === "video");

          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }

        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Stop screen sharing when user stops it via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // End call
  const handleEndCall = () => {
    if (socket) {
      socket.emit("call:end", { callId });
    }
    cleanup();
    onCallEnd();
  };

  // Cleanup
  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    setCallStatus("ended");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Remote video (main) */}
      <div className="relative h-full w-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />

        {/* Connecting overlay */}
        {callStatus === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
            <p className="text-xl text-white">
              {isInitiator ? "Calling..." : "Connecting..."}
            </p>
            <p className="mt-2 text-sm text-white/70">{otherUser.name}</p>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute right-2 top-2 sm:right-4 sm:top-4 h-24 w-32 sm:h-40 sm:w-56 overflow-hidden rounded-lg border-2 border-white/20 shadow-2xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full -scale-x-100 object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <VideoOff className="h-4 w-4 sm:h-8 sm:w-8 text-white/50" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 transform px-4 w-full sm:w-auto">
          <div className="flex items-center justify-center gap-2 sm:gap-4 rounded-full bg-black/60 px-3 py-3 sm:px-6 sm:py-4 backdrop-blur-lg">
            {/* Toggle video */}
            <button
              onClick={toggleVideo}
              className={`rounded-full p-2 sm:p-4 transition-all ${
                isVideoEnabled
                  ? "bg-white/20 hover:bg-white/30"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? (
                <Video className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              ) : (
                <VideoOff className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              )}
            </button>

            {/* Toggle audio */}
            <button
              onClick={toggleAudio}
              className={`rounded-full p-2 sm:p-4 transition-all ${
                isAudioEnabled
                  ? "bg-white/20 hover:bg-white/30"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              title={isAudioEnabled ? "Mute" : "Unmute"}
            >
              {isAudioEnabled ? (
                <Mic className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              ) : (
                <MicOff className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              )}
            </button>

            {/* Screen share - Hidden on mobile */}
            <button
              onClick={toggleScreenShare}
              className={`hidden sm:flex rounded-full p-2 sm:p-4 transition-all ${
                isScreenSharing
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-white/20 hover:bg-white/30"
              }`}
              title={isScreenSharing ? "Stop sharing" : "Share screen"}
            >
              <MonitorUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </button>

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="rounded-full bg-red-500 p-2 sm:p-4 transition-all hover:bg-red-600"
              title="End call"
            >
              <PhoneOff className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </button>

            {/* Fullscreen - Hidden on mobile */}
            <button
              onClick={toggleFullScreen}
              className="hidden sm:flex rounded-full bg-white/20 p-2 sm:p-4 transition-all hover:bg-white/30"
              title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              ) : (
                <Maximize2 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="absolute left-2 top-2 sm:left-4 sm:top-4">
          <div className="rounded-lg bg-black/60 px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-lg">
            <p className="text-xs sm:text-sm font-semibold text-white">{otherUser.name}</p>
            <p className="text-[10px] sm:text-xs text-white/70">
              {callStatus === "connected" ? "Connected" : "Connecting..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
