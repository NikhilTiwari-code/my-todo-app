/**
 * Dynamic Socket.io Client Loader
 * This prevents socket.io-client from being bundled in server code
 */

import type { Socket } from 'socket.io-client';

/**
 * Create a socket connection with dynamic import
 * Only works in browser environment
 */
export async function createSocket(url: string, options?: any): Promise<Socket> {
  if (typeof window === 'undefined') {
    throw new Error('socket.io-client can only be used in browser');
  }

  const socketIO = await import('socket.io-client');
  return socketIO.io(url, options);
}
