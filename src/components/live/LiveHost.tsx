'use client';

import { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] } as RTCConfiguration;

interface LiveHostProps {
  socket: any;
  onBack: () => void;
}

export function LiveHost({ socket, onBack }: LiveHostProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [streamId, setStreamId] = useState<string>('');
  const [title, setTitle] = useState<string>('My Live Stream');
  const [viewers, setViewers] = useState<number>(0);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    return () => stopLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLive = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(media);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play().catch(() => {});
      }
      socket.emit('live:start', { title }, (res: any) => {
        if (res && res.streamId) setStreamId(res.streamId);
      });

      // Viewer joins -> create RTCPeerConnection per viewer
      socket.on('live:viewer-join', async ({ streamId: sid, viewerSocketId }: any) => {
        if (!localStream || sid !== streamId) return;
        if (peersRef.current.has(viewerSocketId)) return;
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peersRef.current.set(viewerSocketId, pc);
        setViewers(v => v + 1);

        // Add tracks
        localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit('live:signal-ice', { streamId, to: viewerSocketId, candidate: e.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            pc.close();
            peersRef.current.delete(viewerSocketId);
            setViewers(v => Math.max(0, v - 1));
          }
        };

        // Create and send offer
        const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
        await pc.setLocalDescription(offer);
        socket.emit('live:signal-offer', { streamId, to: viewerSocketId, offer });
      });

      // Answer from a viewer
      socket.on('live:signal-answer', async ({ streamId: sid, from, answer }: any) => {
        if (sid !== streamId) return;
        const pc = peersRef.current.get(from);
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          // no-op
        }
      });

      // ICE from viewer
      socket.on('live:signal-ice', async ({ streamId: sid, from, candidate }: any) => {
        if (sid !== streamId) return;
        const pc = peersRef.current.get(from);
        if (!pc || !candidate) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      });

      // Viewer left
      socket.on('live:viewer-left', ({ streamId: sid, viewerSocketId }: any) => {
        if (sid !== streamId) return;
        const pc = peersRef.current.get(viewerSocketId);
        if (pc) {
          pc.close();
          peersRef.current.delete(viewerSocketId);
          setViewers(v => Math.max(0, v - 1));
        }
      });
    } catch (e) {
      // no-op
    }
  };

  const stopLive = () => {
    if (streamId) {
      socket.emit('live:end', { streamId });
    }
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setStreamId('');
    setViewers(0);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Live Stream</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {streamId ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  You are live
                </span>
              ) : (
                'Configure and start your stream'
              )}
            </p>
          </div>
          <button 
            onClick={onBack} 
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stream Title
              </label>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                disabled={!!streamId}
                placeholder="Enter your stream title..."
                className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Viewers</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{viewers}</span>
              </div>
              <div className="text-xs text-gray-500">
                {viewers === 0 ? 'No viewers yet' : `${viewers} ${viewers === 1 ? 'person' : 'people'} watching`}
              </div>
            </div>

            {!streamId ? (
              <button 
                onClick={startLive} 
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                Start Streaming
              </button>
            ) : (
              <button 
                onClick={stopLive} 
                className="w-full rounded-lg bg-red-600 text-white font-semibold px-6 py-3 hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                End Stream
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
