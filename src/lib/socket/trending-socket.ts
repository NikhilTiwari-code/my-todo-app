/**
 * 🔌 Socket.io Trending Updates
 * 
 * Real-time trending data updates via WebSocket
 * 
 * Events:
 * - trending:update - New trending data available
 * - trending:refresh - Client should refresh trending data
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io server for trending updates
 * 
 * @param httpServer - HTTP server instance
 */
export function initializeTrendingSocket(httpServer: HTTPServer) {
  if (io) {
    console.log('⚠️ Socket.io already initialized');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join trending room
    socket.join('trending');

    // Client subscribes to specific category
    socket.on('trending:subscribe', (category: string) => {
      socket.join(`trending:${category}`);
      console.log(`📡 Client ${socket.id} subscribed to ${category}`);
    });

    // Client unsubscribes from category
    socket.on('trending:unsubscribe', (category: string) => {
      socket.leave(`trending:${category}`);
      console.log(`📡 Client ${socket.id} unsubscribed from ${category}`);
    });

    // Request immediate trending data
    socket.on('trending:request', async (category?: string) => {
      try {
        const { getTrendingByCategory, getAllTrending } = await import('@/lib/external-apis/aggregator');
        
        let data;
        if (category) {
          data = await getTrendingByCategory(category, 20);
        } else {
          data = await getAllTrending();
        }

        socket.emit('trending:data', {
          success: true,
          category,
          data,
          timestamp: new Date(),
        });
      } catch (error: any) {
        socket.emit('trending:error', {
          success: false,
          error: error.message,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.io trending server initialized');
  return io;
}

/**
 * Emit trending update to all connected clients
 * 
 * @param data - Update data
 */
export function emitTrendingUpdate(data: any) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized');
    return;
  }

  io.to('trending').emit('trending:update', {
    ...data,
    timestamp: new Date(),
  });

  console.log('📡 Emitted trending update to all clients');
}

/**
 * Emit category-specific trending update
 * 
 * @param category - Category name
 * @param data - Update data
 */
export function emitCategoryUpdate(category: string, data: any) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized');
    return;
  }

  io.to(`trending:${category}`).emit('trending:category-update', {
    category,
    data,
    timestamp: new Date(),
  });

  console.log(`📡 Emitted ${category} update`);
}

/**
 * Broadcast refresh signal to all clients
 */
export function broadcastTrendingRefresh() {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized');
    return;
  }

  io.to('trending').emit('trending:refresh', {
    message: 'New trending data available, please refresh',
    timestamp: new Date(),
  });
}

/**
 * Get Socket.io server instance
 */
export function getSocketServer() {
  return io;
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount() {
  if (!io) return 0;
  return io.sockets.sockets.size;
}
