const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyIdToken } = require('../services/googleVerify');

router.post('/signin', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'idToken required' });

  const payload = await verifyIdToken(idToken);
  const email = payload.email;
  if (!email.endsWith('@chitkara.edu.in')) {
    return res.status(403).json({ message: 'Email must be @chitkara.edu.in' });
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: payload.name || 'Unknown',
      email,
      avatar: payload.picture,
      oauthProvider: 'google',
      emailVerified: payload.email_verified || true
    });
  }

  const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

  res.json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
});

module.exports = router;
