const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const matchSchema = new Schema({
  lostRequestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
  foundRequestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
  score: Number,
  status: { type: String, enum: ['pending','chatVerified','closed'], default: 'pending' },
  chatId: { type: Schema.Types.ObjectId }, // optional
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', matchSchema);
