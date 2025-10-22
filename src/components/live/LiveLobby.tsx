'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { LiveHost } from './LiveHost';
import { LiveViewer } from './LiveViewer';

interface LiveStreamMeta {
  streamId: string;
  title: string;
  hostUserId: string;
  startedAt: string;
  viewers: number;
}

export type LiveMode = 'idle' | 'host' | 'viewer';

export function LiveLobby() {
  const [mode, setMode] = useState<LiveMode>('idle');
  const [streams, setStreams] = useState<LiveStreamMeta[]>([]);
  const [selected, setSelected] = useState<LiveStreamMeta | null>(null);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⏳ LiveLobby waiting for socket connection...', { socket: !!socket, isConnected });
      return;
    }

    console.log('✅ LiveLobby socket connected, fetching streams...');

    // Initial list
    socket.emit('live:list', (list: any[]) => {
      console.log('📺 Received live streams:', list);
      setStreams(list || []);
    });

    // Updates
    const handleUpdate = (list: any[]) => {
      console.log('🔄 Live streams updated:', list);
      setStreams(list || []);
    };
    const handleEnded = ({ streamId }: any) => {
      console.log('🛑 Stream ended:', streamId);
      setStreams(prev => prev.filter(s => s.streamId !== streamId));
      if (selected?.streamId === streamId) setSelected(null);
    };

    socket.on('live:update', handleUpdate);
    socket.on('live:ended', handleEnded);

    return () => {
      socket.off('live:update', handleUpdate);
      socket.off('live:ended', handleEnded);
    };
  }, [socket, isConnected, selected]);

  const idleUI = useMemo(() => (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Streams</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Watch live broadcasts or start your own stream
              </p>
            </div>
            <button
              onClick={() => setMode('host')}
              disabled={!isConnected}
              className={
                `px-5 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ` +
                (!isConnected
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105')
              }
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              {isConnected ? 'Go Live' : 'Connecting...'}
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800" />
        
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Live Now</h2>
          {streams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">No live streams right now</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Be the first to go live!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map((s) => (
                <div key={s.streamId} className="group relative rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs font-medium">
                      {s.viewers} {s.viewers === 1 ? 'viewer' : 'viewers'}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{s.title || 'Live Stream'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Started {new Date(s.startedAt).toLocaleTimeString()}</p>
                    <button 
                      onClick={() => { setSelected(s); setMode('viewer'); }} 
                      className="mt-3 w-full rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Watch Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ), [streams, isConnected]);

  return (
    <div className="py-6">
      {mode === 'idle' && idleUI}
      {mode === 'host' && socket && (
        <div className="mx-auto max-w-5xl p-4">
          <LiveHost socket={socket} onBack={() => setMode('idle')} />
        </div>
      )}
      {mode === 'viewer' && selected && socket && (
        <div className="mx-auto max-w-5xl p-4">
          <LiveViewer socket={socket} stream={selected} onBack={() => { setMode('idle'); setSelected(null); }} />
        </div>
      )}
    </div>
  );
}
