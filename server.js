const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store online users: userId -> socketId
const onlineUsers = new Map();

// Store active video calls: callId -> { caller, receiver, offer, answer }
const activeCalls = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.io authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`✅ User connected: ${userId}`);

    // Store online user
    onlineUsers.set(userId, socket.id);
    
    // Broadcast user online status to all clients
    io.emit("user:online", { userId });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle typing indicator
    socket.on("typing:start", ({ receiverId }) => {
      io.to(`user:${receiverId}`).emit("typing:start", { userId });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      io.to(`user:${receiverId}`).emit("typing:stop", { userId });
    });

    // Handle sending message
    socket.on("message:send", (data) => {
      const { receiverId, message } = data;
      
      console.log(`💬 Message from ${userId} to ${receiverId}`);
      
      // Check if receiver is online
      const isReceiverOnline = onlineUsers.has(receiverId);
      
      // Emit to receiver if online
      if (isReceiverOnline) {
        console.log(`✅ Receiver ${receiverId} is online, delivering message`);
        io.to(`user:${receiverId}`).emit("message:receive", message);
        
        // Emit delivery confirmation back to sender
        socket.emit("message:delivered", {
          messageId: message._id,
          deliveredAt: new Date(),
        });
      } else {
        // Receiver is offline, message saved in DB, will see when they come back
        console.log(`📬 Message queued for offline user: ${receiverId}`);
      }
    });

    // Handle message read
    socket.on("message:read", ({ messageIds, senderId }) => {
      io.to(`user:${senderId}`).emit("message:read", {
        messageIds,
        readBy: userId,
        readAt: new Date(),
      });
    });

    // ===== VIDEO CALL EVENTS =====

    // Initiate call
    socket.on("call:initiate", ({ receiverId, callId, offer }) => {
      activeCalls.set(callId, {
        caller: userId,
        receiver: receiverId,
        offer,
        status: "ringing",
      });

      io.to(`user:${receiverId}`).emit("call:incoming", {
        callId,
        caller: userId,
        offer,
      });
    });

    // Answer call
    socket.on("call:answer", ({ callId, answer }) => {
      const call = activeCalls.get(callId);
      if (call) {
        call.answer = answer;
        call.status = "active";
        
        io.to(`user:${call.caller}`).emit("call:answered", {
          callId,
          answer,
        });
      }
    });

    // Reject call
    socket.on("call:reject", ({ callId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        io.to(`user:${call.caller}`).emit("call:rejected", { callId });
        activeCalls.delete(callId);
      }
    });

    // End call
    socket.on("call:end", ({ callId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        // Notify both parties
        io.to(`user:${call.caller}`).emit("call:ended", { callId });
        io.to(`user:${call.receiver}`).emit("call:ended", { callId });
        activeCalls.delete(callId);
      }
    });

    // ICE candidate exchange
    socket.on("call:ice-candidate", ({ callId, candidate, targetUserId }) => {
      io.to(`user:${targetUserId}`).emit("call:ice-candidate", {
        callId,
        candidate,
      });
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      
      // Broadcast user offline status to all clients
      io.emit("user:offline", { userId });

      // End any active calls
      activeCalls.forEach((call, callId) => {
        if (call.caller === userId || call.receiver === userId) {
          const otherUser = call.caller === userId ? call.receiver : call.caller;
          io.to(`user:${otherUser}`).emit("call:ended", { callId });
          activeCalls.delete(callId);
        }
      });
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
  });
});
