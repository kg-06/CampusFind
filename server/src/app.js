require('dotenv').config();
require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');

const authRoutes = require('./routes/auth');
const requestsRoutes = require('./routes/requests');
const matchesRoutes = require('./routes/matches');
const { socketHandler } = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*' }
});
app.set('io', io);

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.use('/auth', authRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/matches', matchesRoutes);


app.get('/', (req, res) => res.send('Lost & Found API'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

socketHandler(io);
