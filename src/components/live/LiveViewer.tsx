'use client';

import { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] } as RTCConfiguration;

interface LiveViewerProps {
  socket: any;
  stream: { streamId: string; title: string; hostUserId: string; startedAt: string; viewers: number };
  onBack: () => void;
}

export function LiveViewer({ socket, stream, onBack }: LiveViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<'connecting' | 'watching' | 'ended'>('connecting');

  useEffect(() => {
    if (!socket) return;

    let cancelled = false;

    const setup = async () => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('live:signal-ice', { streamId: stream.streamId, candidate: e.candidate });
        }
      };

      socket.emit('live:join', { streamId: stream.streamId }, (ok: boolean) => {
        // no-op
      });

      socket.on('live:signal-offer', async ({ streamId, offer }: any) => {
        if (streamId !== stream.streamId) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('live:signal-answer', { streamId: stream.streamId, answer });
          setStatus('watching');
        } catch (e) {}
      });

      socket.on('live:signal-ice', async ({ streamId, candidate }: any) => {
        if (streamId !== stream.streamId || !candidate) return;
        console.log('🧊 LiveViewer: Received ICE candidate from host');
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('❌ LiveViewer: Error adding ICE candidate:', e);
        }
      });

      socket.on('live:ended', ({ streamId: sid }: any) => {
        if (cancelled || sid !== stream.streamId) return;
        console.log('🛑 LiveViewer: Stream ended by host');
        setStatus('ended');
      });
    };

    setup();

    return () => {
      cancelled = true;
      socket.emit('live:leave', { streamId: stream.streamId });
      socket.off('live:signal-offer');
      socket.off('live:signal-ice');
      socket.off('live:ended');
      if (pcRef.current) pcRef.current.close();
    };
  }, [socket, stream.streamId]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack} 
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                ← Back
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{stream.title}</h2>
                  {status === 'watching' && (
                    <span className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-md text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {status === 'connecting' && 'Connecting to stream...'}
                  {status === 'watching' && `Watching live stream`}
                  {status === 'ended' && 'Stream has ended'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="bg-black aspect-video">
          {status === 'ended' ? (
            <div className="flex h-full items-center justify-center flex-col gap-3 text-white">
              <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              <div className="text-center">
                <p className="text-lg font-semibold">Stream Ended</p>
                <p className="text-sm text-gray-400 mt-1">This live stream has finished</p>
              </div>
            </div>
          ) : status === 'connecting' ? (
            <div className="flex h-full items-center justify-center flex-col gap-3 text-white">
              <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Connecting...</p>
            </div>
          ) : (
            <video ref={videoRef} playsInline className="w-full h-full object-contain" />
          )}
        </div>

        {/* Stream Info */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Viewers</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stream.viewers}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Started</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(stream.startedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
