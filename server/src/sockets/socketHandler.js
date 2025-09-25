const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const Match = require('../models/Match');

function socketHandler(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Auth error'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error('Auth error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('socket connected', socket.user.email);

    socket.on('join', async ({ matchId }) => {
      socket.emit('joined', { matchId });
    });

    socket.on('message:send', async ({ matchId, text }) => {
      if (!text) return;
      const msg = await ChatMessage.create({ matchId, sender: socket.user.id, text });
      io.to(`match:${matchId}`).emit('message:new', { msg });
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.user.email);
    });
  });
}

module.exports = { socketHandler };
