const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Match = require('../models/Match');
const ChatMessage = require('../models/ChatMessage');

router.get('/:id', auth, async (req, res) => {
  const m = await Match.findById(req.params.id).populate('lostRequestId foundRequestId');
  if (!m) return res.status(404).json({ message: 'Match not found' });
  res.json(m);
});

router.get('/:id/messages', auth, async (req, res) => {
  const matchId = req.params.id;
  try {

    const m = await Match.findById(matchId).lean();
    if (!m) return res.status(404).json({ message: 'Match not found' });

    const messages = await ChatMessage.find({ matchId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email')
      .lean();

    return res.json({ messages });
  } catch (err) {
    console.error('GET /api/matches/:id/messages error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
