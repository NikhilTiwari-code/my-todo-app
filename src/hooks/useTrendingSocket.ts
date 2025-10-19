/**
 * 🔌 Trending Socket.io Hook
 * 
 * React hook for subscribing to real-time trending updates
 */

'use client';

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket } from '@/lib/socket-client';

export function useTrendingSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [trendingUpdate, setTrendingUpdate] = useState<any>(null);

  useEffect(() => {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found, skipping Socket.io connection');
      return;
    }

    // Initialize Socket.io connection with dynamic import
    let isMounted = true;
    
    const initSocket = async () => {
      try {
        const newSocket = await createSocket(
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          {
            auth: { token },
            transports: ['websocket', 'polling'],
          }
        );
        
        if (!isMounted) {
          newSocket.disconnect();
          return;
        }

        newSocket.on('connect', () => {
          console.log('✅ Connected to Socket.io');
          setConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Disconnected from Socket.io');
          setConnected(false);
        });

        // Listen for trending updates
        newSocket.on('trending:update', (data) => {
          console.log('📡 Trending update received:', data);
          setTrendingUpdate(data);
        });

        newSocket.on('trending:refresh', (data) => {
          console.log('🔄 Trending refresh signal:', data);
          setTrendingUpdate({ ...data, type: 'refresh' });
        });

        newSocket.on('trending:category-update', (data) => {
          console.log('📡 Category update received:', data);
          setTrendingUpdate({ ...data, type: 'category' });
        });

        setSocket(newSocket);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };
    
    initSocket();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Subscribe to specific category
  const subscribeToCategory = (category: string) => {
    if (socket && connected) {
      socket.emit('trending:subscribe', category);
    }
  };

  // Unsubscribe from category
  const unsubscribeFromCategory = (category: string) => {
    if (socket && connected) {
      socket.emit('trending:unsubscribe', category);
    }
  };

  // Request immediate trending data
  const requestTrendingData = (category?: string) => {
    if (socket && connected) {
      socket.emit('trending:request', category);
    }
  };

  return {
    socket,
    connected,
    trendingUpdate,
    subscribeToCategory,
    unsubscribeFromCategory,
    requestTrendingData,
  };
}
