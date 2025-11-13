const logger = require('../utils/logger');
const { authenticateSocket } = require('../middleware/socketAuth');

/**
 * Initialize Socket.io connection handling
 */
const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const user = await authenticateSocket(token);
      if (!user) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.user.email} (${socket.id})`);

    // Join user-specific room
    socket.join(`user:${socket.user.id}`);

    // Join role-specific room
    socket.join(`role:${socket.user.role}`);

    // Join all-users room for broadcast notifications
    socket.join('all-users');

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.user.email} (${socket.id})`);
    });

    // Handle join lead room (for lead-specific updates)
    socket.on('join:lead', (leadId) => {
      socket.join(`lead:${leadId}`);
      logger.info(`User ${socket.user.email} joined lead room: ${leadId}`);
    });

    // Handle leave lead room
    socket.on('leave:lead', (leadId) => {
      socket.leave(`lead:${leadId}`);
      logger.info(`User ${socket.user.email} left lead room: ${leadId}`);
    });

    // Handle error
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  logger.info('Socket.io initialized');
};

module.exports = {
  initializeSocket
};

