// "use client";


"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isInitializing = useRef(false);

  useEffect(() => {
    let socketInstance: Socket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const getToken = async () => {
      try {
        console.log("🔑 Fetching socket token...");
        const response = await fetch("/api/auth/socket-token", {
          credentials: "include",
          cache: "no-store", // Ensure we get a fresh token
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Token fetch failed:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Failed to get token: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.token) {
          console.error("❌ No token in response:", data);
          throw new Error("No token in response");
        }
        
        console.log("✅ Socket token retrieved successfully");
        return data.token;
      } catch (error) {
        console.error("❌ Error in getToken:", error);
        throw error;
      }
    };

    const initializeSocket = async () => {
      // Prevent multiple simultaneous initialization attempts
      if (isInitializing.current) {
        console.log("⚠️ Socket initialization already in progress");
        return;
      }

      // Only initialize socket if user is authenticated
      if (!isAuthenticated) {
        console.log("⏳ User not authenticated yet, skipping socket connection");
        return;
      }

      // Don't initialize if already connected
      if (socketInstance?.connected) {
        console.log("✅ Socket already connected");
        return;
      }

      isInitializing.current = true;

      try {
        console.log("🔄 Starting socket initialization...");
        
        const token = await getToken();
        
        if (!token) {
          throw new Error("Token is empty");
        }

        console.log("🔌 Attempting to connect to socket with token...");
        
        // Use Railway socket server URL in production
        let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                        process.env.NEXT_PUBLIC_APP_URL || 
                        "http://localhost:3000";
        
        // Ensure URL has protocol for production
        if (socketUrl && !socketUrl.startsWith('http')) {
          socketUrl = `https://${socketUrl}`;
        }
        
        console.log("🔗 Connecting to socket server:", socketUrl);
        
        // Initialize Socket.io connection
        socketInstance = io(socketUrl, {
          auth: {
            token,
          },
          reconnection: false, // Handle reconnection manually
          transports: ["websocket", "polling"],
          timeout: 10000, // 10 second timeout
          forceNew: true, // Create a new connection
        });

        socketInstance.on("connect", () => {
          console.log("✅ Socket connected successfully! Socket ID:", socketInstance!.id);
          setIsConnected(true);
          reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
          isInitializing.current = false;
        });

        socketInstance.on("disconnect", async (reason) => {
          console.log("❌ Socket disconnected, reason:", reason);
          setIsConnected(false);
          isInitializing.current = false;
          
          // Only reconnect if it's not a manual disconnect
          if (reason !== "io client disconnect" && socketInstance) {
            if (reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current++;
              console.log(`🔄 Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts}...`);
              
              // Clear any existing timeout
              if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
              }
              
              reconnectTimeout = setTimeout(async () => {
                try {
                  // Get fresh token
                  const freshToken = await getToken();
                  console.log("✅ Got fresh token for reconnection");
                  
                  // Update auth token and reconnect
                  if (socketInstance) {
                    socketInstance.auth = { token: freshToken };
                    socketInstance.connect();
                  }
                } catch (error) {
                  console.error("❌ Failed to get fresh token for reconnection:", error);
                }
              }, 2000 * reconnectAttempts.current); // Exponential backoff
            } else {
              console.error("❌ Max reconnection attempts reached");
            }
          }
        });

        socketInstance.on("connect_error", async (error: any) => {
          console.error("❌ Socket connection error:", error.message);
          console.error("Error details:", error);
          setIsConnected(false);
          isInitializing.current = false;
          
          // If authentication error, try to get a new token
          if (error.message === "Authentication error" || error.message.includes("auth")) {
            console.log("🔄 Authentication error detected, will retry with fresh token on next attempt");
            reconnectAttempts.current++;
          }
        });

        socketInstance.on("user:online", ({ userId }: { userId: string }) => {
          console.log("👤 User came online:", userId);
          setOnlineUsers((prev) => new Set(prev).add(userId));
        });

        socketInstance.on("user:offline", ({ userId }: { userId: string }) => {
          console.log("👤 User went offline:", userId);
          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        });

        // Listen for online users list on initial connection
        socketInstance.on("users:online", ({ userIds }: { userIds: string[] }) => {
          console.log("👥 Received online users list:", userIds);
          setOnlineUsers(new Set(userIds));
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error("❌ Failed to initialize socket:", error);
        isInitializing.current = false;
        setIsConnected(false);
      }
    };

    // Only run when authentication state is determined
    if (!isLoading) {
      initializeSocket();
    }

    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      
      if (socketInstance) {
        console.log("🧹 Cleaning up socket connection");
        socketInstance.removeAllListeners(); // Remove all listeners
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        isInitializing.current = false;
      }
    };
  }, [isAuthenticated, isLoading]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
