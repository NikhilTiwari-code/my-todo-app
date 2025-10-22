# Live Streaming Feature - Complete Implementation

## Overview

The live streaming feature allows users to broadcast live video to their followers and watch others' streams in real-time. Built with WebRTC for peer-to-peer video transmission and Socket.io for signaling.

## Architecture

### Client-Side Components

- **`/src/app/live/page.tsx`** - Main live page route
- **`/src/components/live/LiveLobby.tsx`** - Stream lobby (list & join)
- **`/src/components/live/LiveHost.tsx`** - Host streaming interface
- **`/src/components/live/LiveViewer.tsx`** - Viewer playback interface

### Server-Side

- **`server.js`** - Socket.io events for live streaming
  - `live:list` - Get current live streams
  - `live:start` - Host starts streaming
  - `live:join` - Viewer joins stream
  - `live:leave` - Viewer leaves stream
  - `live:end` - Host ends stream
  - `live:signal-*` - WebRTC signaling (offer/answer/ICE)

## How It Works

### 1. Starting a Stream (Host)

1. User clicks "Go Live" button
2. Browser requests camera/microphone permissions
3. `LiveHost` component:
   - Captures `getUserMedia` stream
   - Emits `live:start` with stream title
   - Server creates stream entry and broadcasts to all users
4. When viewers join:
   - Server emits `live:viewer-join` to host
   - Host creates `RTCPeerConnection` for each viewer
   - Sends WebRTC offer via Socket.io
   - Receives answer and establishes connection

### 2. Watching a Stream (Viewer)

1. User sees live stream in lobby
2. Clicks "Watch Now"
3. `LiveViewer` component:
   - Emits `live:join` event
   - Creates `RTCPeerConnection`
   - Receives offer from host
   - Sends answer back
   - ICE candidates exchanged
   - Video stream starts playing

### 3. WebRTC P2P Architecture

```
Host (Broadcaster)
    |
    |--- RTCPeerConnection #1 ---> Viewer 1
    |--- RTCPeerConnection #2 ---> Viewer 2
    |--- RTCPeerConnection #3 ---> Viewer 3
```

Each viewer gets a dedicated peer connection from the host.

## Key Features

✅ **Real-time streaming** - WebRTC peer-to-peer video
✅ **Socket.io signaling** - Robust WebSocket-based signaling
✅ **Live viewer count** - Real-time updates
✅ **Stream lobby** - Browse active streams
✅ **Automatic cleanup** - Streams end when host disconnects
✅ **Mobile responsive** - Works on desktop and mobile
✅ **Dark mode** - Full theme support

## Configuration

### Environment Variables

```env
# Socket JWT Secret (must match between server.js and socket-token API)
SOCKET_JWT_SECRET=your-secret-here

# App URL for CORS
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### STUN/TURN Servers

Currently uses Google's public STUN server:
```js
const ICE_SERVERS = { 
  iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] 
};
```

**For production**, add TURN servers for NAT traversal:
```js
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
};
```

## Security

- **JWT Authentication** - Socket connections require valid JWT token
- **Token Expiry** - Socket tokens expire after 2 hours
- **Host Validation** - Only stream owner can end stream
- **Auto Cleanup** - Streams end on host disconnect

## Scaling Considerations

### Current: P2P (1-to-Many)

- **Good for**: 1-10 viewers
- **Limitation**: Host bandwidth grows with viewer count
- **Each viewer**: ~2-4 Mbps upload from host

### Future: SFU (Selective Forwarding Unit)

For larger audiences (10+ viewers), migrate to SFU:
- **mediasoup** - Node.js SFU
- **Janus** - C-based SFU
- **LiveKit** - Managed SFU

Host uploads once, SFU distributes to viewers.

## Testing Locally

1. **Start server**:
   ```bash
   node server.js
   ```

2. **Open two browser windows**:
   - Window A: Login → `/live` → "Go Live" → Allow camera → "Start Streaming"
   - Window B: Login → `/live` → Click stream card → "Watch Now"

3. **Verify**:
   - ✅ Window B sees video from Window A
   - ✅ Viewer count updates in real-time
   - ✅ Ending stream notifies viewers

## Troubleshooting

### "Invalid signature" JWT Error
- **Cause**: Mismatch between `JWT_SECRET` and `SOCKET_JWT_SECRET`
- **Fix**: Set `SOCKET_JWT_SECRET` in `.env.local` or use hardcoded fallback

### Camera Permission Denied
- **Cause**: User blocked camera/mic access
- **Fix**: Grant permissions in browser settings

### No Video in Viewer
- **Cause**: 
  1. ICE connection failed (firewall/NAT)
  2. Host stream not started
  3. WebRTC offer/answer failed
- **Fix**:
  1. Add TURN server for NAT traversal
  2. Check browser console for WebRTC errors
  3. Verify socket events in Network tab

### Build Error: "Can't resolve AppShell"
- **Cause**: Next.js build cache
- **Fix**: 
  ```bash
  rm -rf .next
  npm run dev
  ```

## API Reference

### Socket Events (Client → Server)

```ts
// Get list of live streams
socket.emit('live:list', (streams: LiveStream[]) => {});

// Start streaming
socket.emit('live:start', { title: string }, (res: { streamId: string }) => {});

// Join stream
socket.emit('live:join', { streamId: string }, (ok: boolean) => {});

// Leave stream
socket.emit('live:leave', { streamId: string });

// End stream (host only)
socket.emit('live:end', { streamId: string });

// WebRTC signaling
socket.emit('live:signal-offer', { streamId, to, offer });
socket.emit('live:signal-answer', { streamId, answer });
socket.emit('live:signal-ice', { streamId, to?, candidate });
```

### Socket Events (Server → Client)

```ts
// Stream updates (broadcast)
socket.on('live:update', (streams: LiveStream[]) => {});

// Stream ended
socket.on('live:ended', ({ streamId: string }) => {});

// Viewer joined (to host)
socket.on('live:viewer-join', ({ streamId, viewerSocketId }) => {});

// Viewer left (to host)
socket.on('live:viewer-left', ({ streamId, viewerSocketId }) => {});

// WebRTC signals
socket.on('live:signal-offer', ({ streamId, offer }) => {});
socket.on('live:signal-answer', ({ streamId, from, answer }) => {});
socket.on('live:signal-ice', ({ streamId, from, candidate }) => {});
```

## UI Design

All components use **Tailwind CSS only** - no external UI libraries.

### Design System

- **Colors**: Indigo → Purple gradients for primary actions
- **Live indicator**: Red pulsing dot + "LIVE" badge
- **Typography**: Bold headings, clear hierarchy
- **Spacing**: Consistent padding (p-4, p-6, p-8)
- **Borders**: Subtle gray borders, rounded corners
- **Dark mode**: Full support with dark: utilities

### Components

- **Navbar** - Glass morphism with backdrop blur
- **Cards** - White/dark with hover states
- **Buttons** - Gradient primary, red for end/danger
- **Video** - Black background, aspect-video
- **Loading** - Spinner with pulse animation

## Performance

- **Lazy Socket** - Socket connection created only when needed
- **Cleanup** - All peer connections closed on unmount
- **Stream Stop** - Media tracks stopped when ending
- **Auto Disconnect** - Socket cleans up on host/viewer exit

## Future Enhancements

- [ ] Chat during live stream
- [ ] Reactions (hearts, emojis)
- [ ] Screen sharing
- [ ] Stream recording
- [ ] Scheduled streams
- [ ] Viewer analytics
- [ ] Stream quality selection
- [ ] Mobile app notifications

## Credits

Built with:
- **WebRTC** - Peer-to-peer video
- **Socket.io** - Real-time signaling
- **Next.js** - React framework
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
