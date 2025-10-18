// Socket.io Server for Railway Deployment
const { createServer } = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const PORT = process.env.PORT || 4000;

// Store online users
const onlineUsers = new Map();
const activeCalls = new Map();

// Create HTTP server
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.io server is running!");
});

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://my-todo-app-gilt.vercel.app",
      /\.vercel\.app$/,  // Allow all Vercel preview deployments
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Helper to sanitize secrets (remove stray whitespace/newlines)
function getSanitizedJwtSecret() {
  const raw = process.env.JWT_SECRET || "";
  // Remove any quotes, whitespace, or newlines that might have been pasted in
  return raw.replace(/["'`]/g, "").replace(/\s+/g, "").trim();
}

function sha256Prefix(input) {
  try {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex").slice(0, 12);
  } catch {
    return "<hash-error>";
  }
}

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Hardcoded fallback for testing - REPLACE IN PRODUCTION!
  const secret = process.env.SOCKET_JWT_SECRET || "6f28588fc52bdfd1c268d8ffc16fcf1f333d653a04e6ec0a065f5911938d5176";

  console.log("🔐 Socket authentication attempt with dedicated socket token...");

  if (!process.env.SOCKET_JWT_SECRET) {
    console.warn("⚠️ WARNING: Using hardcoded SOCKET_JWT_SECRET for testing. Set environment variable in production!");
  }
  
  if (!token) {
    console.log("❌ No socket token provided");
    return next(new Error("Authentication error: No token provided."));
  }

  console.log("🎫 Socket token received (first 20 chars):", token.substring(0, 20) + "...");

  try {
    const decoded = jwt.verify(token, secret);
    const userId = decoded.id || decoded.userId; // Ensure we get the ID from the new token
    
    if (!userId) {
      console.log("❌ No user ID in socket token");
      return next(new Error("Authentication error: Invalid token payload."));
    }
    
    socket.data.userId = userId;
    console.log("✅ User authenticated via socket token:", userId);
    next();
  } catch (error) {
    console.error("❌ Socket token verification failed:", error.message);
    return next(new Error(`Authentication error: ${error.message}`));
  }
});

// Connection handler
io.on("connection", (socket) => {
  const userId = socket.data.userId;
  console.log(`✅ User connected: ${userId}`);

  onlineUsers.set(userId, socket.id);
  console.log(`📊 Total online users: ${onlineUsers.size}`);
  
  io.emit("user:online", { userId });
  socket.join(`user:${userId}`);

  // Typing indicators
  socket.on("typing:start", ({ receiverId }) => {
    io.to(`user:${receiverId}`).emit("typing:start", { userId });
  });

  socket.on("typing:stop", ({ receiverId }) => {
    io.to(`user:${receiverId}`).emit("typing:stop", { userId });
  });

  // Message handling
  socket.on("message:send", (data) => {
    const { receiverId, message } = data;
    console.log(`💬 Message from ${userId} to ${receiverId}`);
    
    if (onlineUsers.has(receiverId)) {
      console.log(`✅ Delivering message to online user`);
      io.to(`user:${receiverId}`).emit("message:receive", message);
      socket.emit("message:delivered", {
        messageId: message._id,
        deliveredAt: new Date(),
      });
    }
  });

  socket.on("message:read", ({ messageIds, senderId }) => {
    io.to(`user:${senderId}`).emit("message:read", {
      messageIds,
      readBy: userId,
      readAt: new Date(),
    });
  });

  // Story events
  socket.on("story:new", ({ storyId, followers }) => {
    console.log(`📸 New story posted: ${storyId}`);
    // Notify all followers
    followers.forEach((followerId) => {
      if (onlineUsers.has(followerId)) {
        io.to(`user:${followerId}`).emit("story:new", {
          userId,
          storyId,
          createdAt: new Date(),
        });
      }
    });
  });

  // Reel events
  socket.on("reel:new", ({ reelId, followers }) => {
    console.log(`🎬 New reel posted: ${reelId}`);
    // Notify all followers
    followers.forEach((followerId) => {
      if (onlineUsers.has(followerId)) {
        io.to(`user:${followerId}`).emit("reel:new", {
          userId,
          reelId,
          createdAt: new Date(),
        });
      }
    });
  });

  socket.on("reel:like", ({ reelId, reelOwnerId }) => {
    console.log(`❤️ Reel liked: ${reelId}`);
    // Notify reel owner
    if (onlineUsers.has(reelOwnerId)) {
      io.to(`user:${reelOwnerId}`).emit("reel:like", {
        reelId,
        likedBy: userId,
        createdAt: new Date(),
      });
    }
  });

  socket.on("reel:comment", ({ reelId, reelOwnerId, commentText }) => {
    console.log(`💬 Reel commented: ${reelId}`);
    // Notify reel owner
    if (onlineUsers.has(reelOwnerId)) {
      io.to(`user:${reelOwnerId}`).emit("reel:comment", {
        reelId,
        commentedBy: userId,
        commentText,
        createdAt: new Date(),
      });
    }
  });

  // Video call events
  socket.on("call:initiate", ({ receiverId, callId, offer }) => {
    console.log(`📞 Call initiated: ${callId}`);
    activeCalls.set(callId, { caller: userId, receiver: receiverId, offer, status: "ringing" });
    io.to(`user:${receiverId}`).emit("call:incoming", { callId, caller: userId, offer });
  });

  socket.on("call:answer", ({ callId, answer }) => {
    const call = activeCalls.get(callId);
    if (call) {
      call.answer = answer;
      call.status = "active";
      console.log(`✅ Call answered: ${callId}`);
      io.to(`user:${call.caller}`).emit("call:answered", { callId, answer });
    }
  });

  socket.on("call:reject", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (call) {
      console.log(`❌ Call rejected: ${callId}`);
      io.to(`user:${call.caller}`).emit("call:rejected", { callId });
      activeCalls.delete(callId);
    }
  });

  socket.on("call:end", ({ callId }) => {
    const call = activeCalls.get(callId);
    if (call) {
      console.log(`📴 Call ended: ${callId}`);
      const otherUser = call.caller === userId ? call.receiver : call.caller;
      io.to(`user:${otherUser}`).emit("call:ended", { callId });
      activeCalls.delete(callId);
    }
  });

  socket.on("call:ice-candidate", ({ callId, candidate, targetUserId }) => {
    io.to(`user:${targetUserId}`).emit("call:ice-candidate", {
      callId,
      candidate,
      fromUserId: userId,
    });
  });

  // Notification events (for backend to push notifications)
  socket.on("notification:emit", ({ recipientId, notification }) => {
    console.log(`🔔 Emitting notification to user ${recipientId}`);
    io.to(`user:${recipientId}`).emit("notification", notification);
  });

  socket.on("notification:count", ({ recipientId, count }) => {
    console.log(`📊 Emitting notification count to user ${recipientId}: ${count}`);
    io.to(`user:${recipientId}`).emit("notification:count", count);
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${userId}`);
    onlineUsers.delete(userId);
    console.log(`📊 Total online users: ${onlineUsers.size}`);
    
    io.emit("user:offline", { userId });

    activeCalls.forEach((call, callId) => {
      if (call.caller === userId || call.receiver === userId) {
        const otherUser = call.caller === userId ? call.receiver : call.caller;
        io.to(`user:${otherUser}`).emit("call:ended", { callId });
        activeCalls.delete(callId);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
});

// Export for use in API routes (if running in same process)
module.exports = { io, server, onlineUsers };
