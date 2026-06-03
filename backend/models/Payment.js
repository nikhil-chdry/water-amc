const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Split'], required: true },
  amount:      { type: Number, required: true },
  reference:   { type: String, default: '' },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:         { type: String, enum: ['customer_payment', 'raw_material', 'supplier_due'], required: true },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  amcLinked:    { type: Boolean, default: false },
  partyName:    { type: String, default: '' },
  description:  { type: String, default: '' },
  amount:       { type: Number, required: true }, // total amount
  isSplit:      { type: Boolean, default: false },
  splitPayments: [splitSchema], // array of split modes
  paymentMode:  { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Split', 'Due', 'Pending'], default: 'Cash' },
  date:         { type: Date, required: true },
  status:       { type: String, enum: ['Paid', 'Due', 'Partial'], default: 'Paid' },
  paidAmount:   { type: Number, default: 0 },
  notes:        { type: String, default: '' },
  reference:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);