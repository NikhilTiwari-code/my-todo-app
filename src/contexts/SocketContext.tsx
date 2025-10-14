"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const initializeSocket = async () => {
      try {
        // Get token from the API endpoint since it's httpOnly cookie
        const response = await fetch("/api/auth/socket-token", {
          credentials: "include",
        });
        
        if (!response.ok) {
          console.log("❌ No valid token found, cannot connect to socket");
          return;
        }

        const { token } = await response.json();
        console.log("🔌 Attempting to connect to socket with token...");
        
        // Initialize Socket.io connection
        socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
          auth: {
            token,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          transports: ["websocket", "polling"], // Try websocket first, fallback to polling
        });

        socketInstance.on("connect", () => {
          console.log("✅ Socket connected successfully! Socket ID:", socketInstance!.id);
          setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
          console.log("❌ Socket disconnected");
          setIsConnected(false);
        });

        socketInstance.on("connect_error", (error: any) => {
          console.error("❌ Socket connection error:", error.message);
          console.error("Error details:", error);
          setIsConnected(false);
        });

        socketInstance.on("user:online", ({ userId }: { userId: string }) => {
          setOnlineUsers((prev) => new Set(prev).add(userId));
        });

        socketInstance.on("user:offline", ({ userId }: { userId: string }) => {
          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error("❌ Failed to initialize socket:", error);
      }
    };

    initializeSocket();

    // Cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
