const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Authenticate and join room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room.`);
      }
    });

    socket.on('disconnect', () => {
      // Automatic cleanup
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    console.error('Socket.io not initialized!');
  }
  return io;
};

const emitNotification = (userId, eventName, payload) => {
  if (io && userId) {
    io.to(userId.toString()).emit(eventName, payload);
  }
};

module.exports = { initSocket, getIo, emitNotification };
