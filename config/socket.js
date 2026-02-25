let ioInstance;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join-issue', (issueId) => {
      socket.join(`issue-${issueId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

const emitIssueUpdate = (issueId, data) => {
  if (ioInstance) {
    ioInstance.to(`issue-${issueId}`).emit('issue-updated', data);
    ioInstance.emit('dashboard-update', data);
  }
};

module.exports = { initSocket, getIO, emitIssueUpdate };
