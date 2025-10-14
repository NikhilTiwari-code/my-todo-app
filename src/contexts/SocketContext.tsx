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

    const getToken = async () => {
      const response = await fetch("/api/auth/socket-token", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const { token } = await response.json();
      return token;
    };

    const initializeSocket = async () => {
      // Only initialize socket if user is authenticated
      if (!isAuthenticated) {
        console.log("⏳ User not authenticated yet, skipping socket connection");
        return;
      }

      try {
        console.log("🔄 Fetching socket token for authenticated user...");
        
        const token = await getToken();
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
          reconnection: false, // Disable automatic reconnection
          transports: ["websocket", "polling"], // Try websocket first, fallback to polling
        });

        // Handle manual reconnection with fresh token
        socketInstance.on("disconnect", async (reason) => {
          console.log("❌ Socket disconnected, reason:", reason);
          setIsConnected(false);
          
          // Only reconnect if it's not a manual disconnect
          if (reason !== "io client disconnect") {
            console.log("🔄 Attempting manual reconnection with fresh token...");
            
            try {
              // Get fresh token
              const freshToken = await getToken();
              console.log("✅ Got fresh token for reconnection");
              
              // Update auth token
              socketInstance.auth = { token: freshToken };
              
              // Reconnect
              socketInstance.connect();
            } catch (error) {
              console.error("❌ Failed to get fresh token for reconnection:", error);
              // Retry after delay
              setTimeout(() => {
                socketInstance.connect();
              }, 2000);
            }
          }
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
