// const mongoose = require('mongoose');

// const customerSchema = new mongoose.Schema({
//   name:        { type: String, required: true },
//   phone:       { type: String, required: true },
//   address:     { type: String, required: true },
//   productType: { type: String, required: true },
//   installDate: { type: Date, required: true },
//   notes:       { type: String, default: '' },
//   amc: {
//     startDate:   { type: Date },
//     endDate:     { type: Date },
//     amount:      { type: Number },
//     paymentMode: { type: String, default: 'Cash' },
//     status:      { type: String, enum: ['active', 'expiring', 'expired'], default: 'active' },
//   },
// }, { timestamps: true });

// // Auto-calculate AMC status before saving
// customerSchema.pre('save', function (next) {
//   if (this.amc && this.amc.endDate) {
//     const today    = new Date();
//     const end      = new Date(this.amc.endDate);
//     const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

//     if (daysLeft <= 0)       this.amc.status = 'expired';
//     else if (daysLeft <= 30) this.amc.status = 'expiring';
//     else                     this.amc.status = 'active';
//   }
//   next();
// });

// module.exports = mongoose.model('Customer', customerSchema);

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  address:     { type: String, required: true },
  productType: { type: String, required: true },
  installDate: { type: Date, required: true },
  notes:       { type: String, default: '' },
  amc: {
    startDate:   { type: Date },
    endDate:     { type: Date },
    amount:      { type: Number },
    paymentMode: { type: String, default: 'Cash' },
    status:      { type: String, default: 'active' },
    email:       { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);