// Load environment variables FIRST!
require('dotenv').config({ path: '.env.local' });

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store online users: userId -> socketId
const onlineUsers = new Map();

// Store active video calls: callId -> { caller, receiver, offer, answer }
const activeCalls = new Map();

// Live streams state: streamId -> { hostSocketId, hostUserId, title, startedAt, viewers: Set<socketId> }
const liveStreams = new Map();

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

  // Socket JWT secret - must match the one used in /api/auth/socket-token
  const SOCKET_JWT_SECRET = process.env.SOCKET_JWT_SECRET || "6f28588fc52bdfd1c268d8ffc16fcf1f333d653a04e6ec0a065f5911938d5176";
  
  if (!process.env.SOCKET_JWT_SECRET) {
    console.warn("⚠️ WARNING: Using hardcoded SOCKET_JWT_SECRET. Set SOCKET_JWT_SECRET environment variable in production!");
  }

  // Socket.io authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    console.log("🔐 Socket authentication attempt...");
    
    if (!token) {
      console.log("❌ No token provided");
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, SOCKET_JWT_SECRET);
      console.log("✅ Token verified, decoded payload:", decoded);
      
      // Check for userId in different fields
      const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
      
      if (!userId) {
        console.log("❌ No user ID found in token payload:", decoded);
        return next(new Error("Authentication error"));
      }
      
      socket.data.userId = userId;
      console.log("✅ User authenticated:", userId);
      next();
    } catch (err) {
      console.log("❌ Token verification failed:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`✅ User connected: ${userId}`);

    // Store online user
    onlineUsers.set(userId, socket.id);
    
    console.log(`📊 Total online users: ${onlineUsers.size}`, Array.from(onlineUsers.keys()));
    
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

    // ===== LIVE STREAM EVENTS =====

    // Provide list of current live streams (callback-based for simplicity)
    socket.on("live:list", (cb) => {
      try {
        const list = Array.from(liveStreams.entries()).map(([streamId, s]) => ({
          streamId,
          title: s.title || "Live Stream",
          hostUserId: s.hostUserId,
          startedAt: s.startedAt,
          viewers: s.viewers.size,
        }));
        if (typeof cb === "function") cb(list);
      } catch {
        if (typeof cb === "function") cb([]);
      }
    });

    // Host starts a live stream
    socket.on("live:start", async ({ title }, cb) => {
      const streamId = crypto.randomBytes(8).toString("hex");
      const meta = {
        hostSocketId: socket.id,
        hostUserId: userId,
        title: title || "Live Stream",
        startedAt: new Date().toISOString(),
        viewers: new Set(),
      };
      liveStreams.set(streamId, meta);
      socket.join(`live:${streamId}`);
      if (typeof cb === "function") cb({ ok: true, streamId });
      
      // Notify followers that this user went live
      try {
        // Dynamically import User model
        const { default: User } = await import("./src/models/user.models.js");
        const user = await User.findById(userId).select("name followers").lean();
        
        if (user && user.followers && user.followers.length > 0) {
          console.log(`📢 Notifying ${user.followers.length} followers that ${user.name} went live`);
          
          // Emit to each follower's socket
          user.followers.forEach(followerId => {
            const followerSocketId = onlineUsers.get(followerId.toString());
            if (followerSocketId) {
              io.to(`user:${followerId.toString()}`).emit("live:friend-started", {
                streamId,
                hostUserId: userId,
                hostName: user.name,
                title: meta.title,
              });
            }
          });
        }
      } catch (error) {
        console.error("❌ Error notifying followers:", error);
      }
      
      // broadcast update
      io.emit("live:update", Array.from(liveStreams.entries()).map(([id, s]) => ({
        streamId: id,
        title: s.title,
        hostUserId: s.hostUserId,
        startedAt: s.startedAt,
        viewers: s.viewers.size,
      })));
    });

    // Viewer joins a stream; notify host to create an offer
    socket.on("live:join", ({ streamId }, cb) => {
      const s = liveStreams.get(streamId);
      if (!s) { if (typeof cb === "function") cb(false); return; }
      s.viewers.add(socket.id);
      socket.join(`live:${streamId}`);
      // Tell host a viewer joined; host will create offer and target this viewer
      io.to(s.hostSocketId).emit("live:viewer-join", { streamId, viewerSocketId: socket.id });
      if (typeof cb === "function") cb(true);
      // broadcast count update
      io.emit("live:update", Array.from(liveStreams.entries()).map(([id, s2]) => ({
        streamId: id,
        title: s2.title,
        hostUserId: s2.hostUserId,
        startedAt: s2.startedAt,
        viewers: s2.viewers.size,
      })));
    });

    // Viewer leaves a stream explicitly
    socket.on("live:leave", ({ streamId }) => {
      const s = liveStreams.get(streamId);
      if (!s) return;
      if (s.viewers.delete(socket.id)) {
        io.to(s.hostSocketId).emit("live:viewer-left", { streamId, viewerSocketId: socket.id });
        socket.leave(`live:${streamId}`);
        io.emit("live:update", Array.from(liveStreams.entries()).map(([id, s2]) => ({
          streamId: id,
          title: s2.title,
          hostUserId: s2.hostUserId,
          startedAt: s2.startedAt,
          viewers: s2.viewers.size,
        })));
      }
    });

    // Host ends the live stream
    socket.on("live:end", ({ streamId }) => {
      const s = liveStreams.get(streamId);
      if (!s) return;
      if (s.hostSocketId !== socket.id) return; // only host can end
      io.to(`live:${streamId}`).emit("live:ended", { streamId });
      // cleanup
      Array.from(s.viewers).forEach((vid) => io.to(vid).emit("live:ended", { streamId }));
      liveStreams.delete(streamId);
      socket.leave(`live:${streamId}`);
      io.emit("live:update", Array.from(liveStreams.entries()).map(([id, s2]) => ({
        streamId: id,
        title: s2.title,
        hostUserId: s2.hostUserId,
        startedAt: s2.startedAt,
        viewers: s2.viewers.size,
      })));
    });

    // Signaling: host -> viewer (offer)
    socket.on("live:signal-offer", ({ streamId, to, offer }) => {
      if (!to) return;
      io.to(to).emit("live:signal-offer", { streamId, offer });
    });

    // Signaling: viewer -> host (answer)
    socket.on("live:signal-answer", ({ streamId, answer }) => {
      const s = liveStreams.get(streamId);
      if (!s) return;
      io.to(s.hostSocketId).emit("live:signal-answer", { streamId, from: socket.id, answer });
    });

    // ICE candidates both directions
    socket.on("live:signal-ice", ({ streamId, to, candidate }) => {
      if (to) {
        io.to(to).emit("live:signal-ice", { streamId, from: socket.id, candidate });
        return;
      }
      const s = liveStreams.get(streamId);
      if (!s) return;
      io.to(s.hostSocketId).emit("live:signal-ice", { streamId, from: socket.id, candidate });
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      
      console.log(`📊 Total online users after disconnect: ${onlineUsers.size}`, Array.from(onlineUsers.keys()));
      
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

      // Live stream cleanup: if host disconnects, end the stream; if viewer, remove from list and notify host
      for (const [streamId, s] of Array.from(liveStreams.entries())) {
        if (s.hostSocketId === socket.id) {
          io.to(`live:${streamId}`).emit("live:ended", { streamId });
          liveStreams.delete(streamId);
        } else if (s.viewers.has(socket.id)) {
          s.viewers.delete(socket.id);
          io.to(s.hostSocketId).emit("live:viewer-left", { streamId, viewerSocketId: socket.id });
        }
      }
      io.emit("live:update", Array.from(liveStreams.entries()).map(([id, s2]) => ({
        streamId: id,
        title: s2.title,
        hostUserId: s2.hostUserId,
        startedAt: s2.startedAt,
        viewers: s2.viewers.size,
      })));
    });
  });

  // Initialize trending cron jobs (in production only)
  // Note: Uncomment this when you want to enable automated trending updates
  // if (!dev) {
  //   try {
  //     // Dynamically import TypeScript files
  //     import('./src/lib/cron/trending-updater.js').then(module => {
  //       module.startTrendingCronJob();
  //     });
  //     import('./src/lib/cron/hashtag-reset.js').then(module => {
  //       module.startHashtagResetJobs();
  //     });
  //     console.log('✅ Trending cron jobs initialized');
  //   } catch (error) {
  //     console.error('❌ Failed to start cron jobs:', error.message);
  //   }
  // }

  server.listen(port, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Server ready on http://${hostname}:${port}`);
    console.log(`✅ Socket.io server running`);
    console.log('='.repeat(50) + '\n');
  });
});
