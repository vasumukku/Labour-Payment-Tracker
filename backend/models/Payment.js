const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  leaderName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  purpose: { type: String, required: true, trim: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['phonepe', 'googlepay', 'cash', 'bank_transfer', 'other'],
    default: 'cash',
  },
  paymentDate: { type: Date, required: true, default: Date.now },
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: true,
    default: 'morning',
  },
  notes: { type: String, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

paymentSchema.index({ leaderId: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
