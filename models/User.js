
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  replitId: { type: String, sparse: true, unique: true },
  googleId: { type: String, sparse: true, unique: true },
  username: { type: String, required: true },
  email: { type: String },
  readingData: {
    books: [Object],
    stats: Object,
    goals: {
      yearly: { type: Number, default: 52 },
      monthly: { type: Number, default: 4 },
      pages: { type: Number }
    }
  },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
