const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String,
  },
  hasSeenTour: {
    type: Boolean,
    default: false,
  },
  // Rolling array of timestamps for PDF export quota enforcement (2 per 24h)
  pdfExportHistory: {
    type: [Date],
    default: [],
  },
  // Rolling array of timestamps for ATS Score Check quota (10 per 24h)
  atsCheckHistory: {
    type: [Date],
    default: [],
  },
  referralCode: { 
    type: String, 
    unique: true,
    default: () => crypto.randomBytes(4).toString('hex') 
  },
  referralVisits: [{
    fingerprint: String,
    date: { type: Date, default: Date.now }
  }],
  bonusQuotaExpiringAt: { type: Date },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
