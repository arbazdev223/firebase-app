const activeUsers = global.activeUsers;

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('registerUser', (userId) => {
      activeUsers[userId] = socket.id;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of Object.entries(activeUsers)) {
        if (socketId === socket.id) {
          delete activeUsers[userId];
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};
