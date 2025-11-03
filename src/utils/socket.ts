import {io} from 'socket.io-client';

const socket = io(`https://pockit.pockitengineers.com`, {
  path: `/auth/socket.io`,
  transports: ['websocket'], // Ensures WebSocket connection
  forceNew: true,
  reconnectionAttempts: 10, // Number of reconnection attempts
  timeout: 10000, // Connection timeout in milliseconds
});

export default socket;