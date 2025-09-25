const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Request = require('../models/Request');
const Match = require('../models/Match');
const User = require('../models/User');
const { computeScore } = require('../services/matcher');
const { sendMail } = require('../services/email'); // update your email service to export sendMail

router.post('/', auth, async (req, res) => {
  const userId = req.user.id;
  const { kind, category, title, description, locationText, tags = [], images = [] } = req.body;
  if (!kind || !['lost','found'].includes(kind)) return res.status(400).json({ message: 'kind required' });

  const newReq = await Request.create({
    owner: userId, kind, category, title, description, locationText, tags, images
  });

  const oppositeKind = kind === 'lost' ? 'found' : 'lost';
  const candidates = await Request.find({ kind: oppositeKind, status: 'open' }).sort({ createdAt: -1 }).limit(200);

  const matches = [];
  for (const cand of candidates) {
    const score = computeScore(newReq, cand);
    if (score >= 0.6) {
      const lostId = kind === 'lost' ? newReq._id : cand._id;
      const foundId = kind === 'found' ? newReq._id : cand._id;
      const m = await Match.create({ lostRequestId: lostId, foundRequestId: foundId, score });

      await Request.findByIdAndUpdate(newReq._id, { $push: { matches: { matchedRequestId: cand._id, score } }, $set: { status: 'matched' } });
      await Request.findByIdAndUpdate(cand._id, { $push: { matches: { matchedRequestId: newReq._id, score } }, $set: { status: 'matched' } });

      (async () => {
        try {
          const otherUser = await User.findById(cand.owner);
          if (otherUser) {
            await sendMail(
              otherUser.email,
              'Lost & Found: A potential match was found',
              `A match with score ${score} was found. Log in to view.`,
              `<p>A match with score <b>${score.toFixed(2)}</b> was found for your request. Log in to the app to view details and chat.</p>`
            );
          }
        } catch (err) {
          console.error('Failed to send match email:', err);
        }
      })();

      matches.push({ matchId: m._id, matchedRequestId: cand._id, score });
    }
  }

  res.status(201).json({ request: newReq, matches });
});

router.get('/me', auth, async (req, res) => {
  const userId = req.user.id;
  const requests = await Request.find({ owner: userId }).sort({ createdAt: -1 }).lean();

  for (const r of requests) {
    if (!r.matches || r.matches.length === 0) {
      r._matches = [];
      continue;
    }
    const enriched = await Promise.all(r.matches.map(async (mEntry) => {
      try {
        const matchedReq = await Request.findById(mEntry.matchedRequestId).select('title category locationText owner createdAt status').lean();
        let matchDoc = await Match.findOne({
          $or: [
            { lostRequestId: r._id, foundRequestId: mEntry.matchedRequestId },
            { foundRequestId: r._id, lostRequestId: mEntry.matchedRequestId }
          ]
        }).lean();
        return {
          matchedRequest: matchedReq || null,
          score: mEntry.score,
          matchId: matchDoc ? matchDoc._id : null
        };
      } catch (err) {
        return { matchedRequest: null, score: mEntry.score, matchId: null };
      }
    }));
    r._matches = enriched;
  }

  res.json({ requests });
});

router.get('/:id', auth, async (req, res) => {
  const r = await Request.findById(req.params.id).populate('owner', 'name email avatar').lean();
  if (!r) return res.status(404).json({ message: 'Not found' });

  const requesterId = req.user.id;
  if (r.owner._id.toString() === requesterId) {
    return res.json(r);
  }

  const isPaired = await Match.findOne({
    $or: [
      { lostRequestId: r._id, },
      { foundRequestId: r._id }
    ]
  }).lean();

  const ownsCounterpart = await Request.findOne({ owner: requesterId, 'matches.matchedRequestId': r._id });
  if (!ownsCounterpart) return res.status(403).json({ message: 'Not authorized' });

  res.json(r);
});

module.exports = router;
