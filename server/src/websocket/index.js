const { Server } = require('socket.io');
const SocketHandler = require('./socketHandler');

let io = null;
let socketHandler = null;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  socketHandler = new SocketHandler(io);
  
  console.log('WebSocket server initialized');
  
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

const getSocketHandler = () => {
  if (!socketHandler) {
    throw new Error('SocketHandler not initialized');
  }
  return socketHandler;
};

module.exports = {
  initializeWebSocket,
  getIO,
  getSocketHandler
};
