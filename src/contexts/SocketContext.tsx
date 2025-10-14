"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

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
  const { isAuthenticated, isLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const initializeSocket = async () => {
      // Only initialize socket if user is authenticated
      if (!isAuthenticated) {
        console.log("⏳ User not authenticated yet, skipping socket connection");
        return;
      }

      try {
        console.log("🔄 Fetching socket token for authenticated user...");
        
        // Get token from the API endpoint since it's httpOnly cookie
        const response = await fetch("/api/auth/socket-token", {
          credentials: "include",
        });
        
        if (!response.ok) {
          console.error("❌ Failed to get socket token:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error details:", errorText);
          return;
        }

        const { token } = await response.json();
        console.log("✅ Socket token retrieved successfully");
        console.log("🔌 Attempting to connect to socket...");
        
        // Use Railway socket server URL in production
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                         process.env.NEXT_PUBLIC_APP_URL || 
                         "http://localhost:3000";
        
        console.log("🔗 Connecting to socket server:", socketUrl);
        console.log("📍 Environment check:", {
          SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
          APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        });
        
        // Initialize Socket.io connection
        socketInstance = io(socketUrl, {
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

    // Only run when authentication state is determined
    if (!isLoading) {
      initializeSocket();
    }

    // Cleanup function
    return () => {
      if (socketInstance) {
        console.log("🧹 Cleaning up socket connection");
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
    };
  }, [isAuthenticated, isLoading]); // Re-run when auth state changes

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
