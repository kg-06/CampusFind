const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Match = require('../models/Match');

router.get('/:id', auth, async (req, res) => {
  const m = await Match.findById(req.params.id).populate('lostRequestId foundRequestId');
  if (!m) return res.status(404).json({ message: 'Match not found' });
  res.json(m);
});

module.exports = router;
