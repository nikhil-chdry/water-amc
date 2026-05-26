const mongoose = require('mongoose');

const serviceVisitSchema = new mongoose.Schema({
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  date:       { type: Date, required: true },
  complaint:  { type: String, required: true },
  parts:      { type: String, default: '' },
  technician: { type: String, default: '' },
  cost:       { type: Number, default: 0 },
  status:     { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  notes:      { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ServiceVisit', serviceVisitSchema);