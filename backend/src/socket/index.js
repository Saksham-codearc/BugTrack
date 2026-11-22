const { Server } = require('socket.io');
const { env } = require('../config/env');
const { User } = require('../models/User');
const { Project } = require('../models/Project');
const { verifyToken } = require('../utils/token');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrls,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token);
      const user = await User.findById(payload.sub).select('name email');
      if (!user) return next(new Error('Account not found'));

      socket.user = { id: String(user._id), name: user.name, email: user.email };
      return next();
    } catch (_error) {
      return next(new Error('Invalid session'));
    }
  });

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.user.id}`);

    try {
      const projects = await Project.find({ 'members.user': socket.user.id }).select('_id').lean();
      projects.forEach((project) => socket.join(`project:${project._id}`));
    } catch (error) {
      console.error('Socket room setup failed:', error.message);
    }

    socket.emit('socket:ready', { userId: socket.user.id });

    socket.on('project:join', async (projectId) => {
      try {
        const allowed = await Project.exists({ _id: projectId, 'members.user': socket.user.id });
        if (allowed) socket.join(`project:${projectId}`);
      } catch (_error) {
        // Ignore malformed ids from clients.
      }
    });
  });

  return io;
}

const emitToProject = (projectId, event, payload) => {
  if (io) io.to(`project:${projectId}`).emit(event, payload);
};

const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

module.exports = { initSocket, emitToProject, emitToUser };
