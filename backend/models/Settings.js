const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, default: '' },
  businessPhone:{ type: String, default: '' },
  businessEmail:{ type: String, default: '' },
  businessAddress: { type: String, default: '' },
  city:         { type: String, default: '' },
  reminderDays: { type: [Number], default: [30, 15, 7] },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);