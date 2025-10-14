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
  
  console.log("🔐 Socket authentication attempt...");
  const rawSecret = process.env.JWT_SECRET || "";
  const sanitizedSecret = getSanitizedJwtSecret();
  const aliasSecrets = (process.env.JWT_SECRET_ALIASES || "").split(",").map(s => s.trim()).filter(Boolean);
  const candidateSecrets = [rawSecret, sanitizedSecret, ...aliasSecrets].filter(Boolean);

  console.log("🔑 Raw JWT_SECRET exists:", !!rawSecret);
  console.log("🔑 Raw len:", rawSecret.length, "sha256:", sha256Prefix(rawSecret));
  console.log("🔑 Sanitized len:", sanitizedSecret.length, "sha256:", sha256Prefix(sanitizedSecret));
  if (aliasSecrets.length) {
    console.log("🔑 Alias secrets:", aliasSecrets.map((s, i) => ({ i, len: s.length, sha256: sha256Prefix(s) })));
  }
  // Avoid dumping full secret in logs in production; last 2 char codes help spot hidden chars
  if (rawSecret.length >= 2) {
    console.log(
      "🔑 JWT_SECRET last 2 char codes:",
      rawSecret.charCodeAt(rawSecret.length - 2),
      rawSecret.charCodeAt(rawSecret.length - 1)
    );
  }
  
  if (!token) {
    console.log("❌ No token provided");
    return next(new Error("Authentication error"));
  }

  console.log("🎫 Token received (first 20 chars):", token.substring(0, 20) + "...");
  console.log("🎫 Token length:", token.length);

  let decoded = null;
  let usedSecretInfo = null;
  for (let i = 0; i < candidateSecrets.length; i++) {
    const sec = candidateSecrets[i];
    try {
      decoded = jwt.verify(token, sec);
      usedSecretInfo = { index: i, len: sec.length, sha256: sha256Prefix(sec) };
      break;
    } catch (e) {
      // try next
    }
  }

  if (!decoded) {
    console.log("❌ Token verification failed with all candidate secrets. Tried:", candidateSecrets.map((s, i) => ({ i, len: s.length, sha256: sha256Prefix(s) })));
    return next(new Error("Authentication error"));
  }

  console.log("✅ Token verified successfully with secret:", usedSecretInfo);
  console.log("📦 Decoded payload:", JSON.stringify(decoded, null, 2));
  
  const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
  
  if (!userId) {
    console.log("❌ No user ID in token");
    return next(new Error("Authentication error"));
  }
  
  socket.data.userId = userId;
  console.log("✅ User authenticated:", userId);
  next();
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
