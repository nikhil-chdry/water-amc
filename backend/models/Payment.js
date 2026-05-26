const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['customer_payment', 'raw_material', 'supplier_due'],
    required: true,
  },

  // For customer_payment
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  amcLinked:   { type: Boolean, default: false },

  // For raw_material & supplier_due
  partyName:   { type: String, default: '' }, // supplier name
  description: { type: String, default: '' }, // what was bought

  amount:      { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'], default: 'Cash' },
  date:        { type: Date, required: true },
  status:      { type: String, enum: ['Paid', 'Due', 'Partial'], default: 'Paid' },
  paidAmount:  { type: Number, default: 0 }, // for partial payments
  notes:       { type: String, default: '' },
  reference:   { type: String, default: '' }, // cheque no / UPI ref
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);