const express  = require('express');
const router   = express.Router();
const Payment  = require('../models/Payment');
const Customer = require('../models/Customer');
const protect  = require('../middleware/Auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find({ createdBy: req.user._id })
      .populate('customer', 'name phone productType')
      .sort({ date: -1 });

    // Import ServiceVisit
    const ServiceVisit = require('../models/Servicevisit');
    const visits = await ServiceVisit.find({
      createdBy: req.user._id,
      cost: { $gt: 0 },
    }).populate('customer', 'name');

    const customerPayments = payments.filter(p => p.type === 'customer_payment');
    const rawMaterials     = payments.filter(p => p.type === 'raw_material');
    const supplierDues     = payments.filter(p => p.type === 'supplier_due');

    const totalCollected = customerPayments.reduce((sum, p) => {
      if (p.status === 'Paid')    return sum + p.amount;
      if (p.status === 'Partial') return sum + (p.paidAmount || 0);
      return sum;
    }, 0);

    const totalDue = customerPayments.reduce((sum, p) => {
      if (p.status === 'Due')     return sum + p.amount;
      if (p.status === 'Partial') return sum + (p.amount - (p.paidAmount || 0));
      return sum;
    }, 0);

    const totalSpent = rawMaterials.reduce((s, p) => s + p.amount, 0);
    const totalOwed  = supplierDues.filter(p => p.status === 'Due').reduce((s, p) => s + p.amount, 0);

    // Service visit revenue
    const serviceRevenue = visits.reduce((s, v) => s + (v.cost || 0), 0);

    // Payment mode breakdown
    const byMode = { Cash: 0, UPI: 0, 'Bank Transfer': 0, Cheque: 0 };
    customerPayments.forEach(p => {
      if (p.status === 'Due') return;
      const paidAmt = p.status === 'Partial' ? (p.paidAmount || 0) : p.amount;
      if (p.isSplit && p.splitPayments?.length > 0) {
        const splitSum = p.splitPayments.reduce((s, sp) => s + sp.amount, 0);
        p.splitPayments.forEach(s => {
          if (byMode.hasOwnProperty(s.paymentMode)) {
            const proportion = splitSum > 0 ? (s.amount / splitSum) : 0;
            byMode[s.paymentMode] += Math.round(paidAmt * proportion);
          }
        });
      } else {
        if (byMode.hasOwnProperty(p.paymentMode)) {
          byMode[p.paymentMode] += paidAmt;
        }
      }
    });

    res.json({
      payments,
      visits,  // ← send visits too
      stats: { totalCollected, totalDue, totalSpent, totalOwed, byMode, serviceRevenue }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {

    // console.log('Payment data received:', JSON.stringify(req.body, null, 2));
    
    const payment = await Payment.create({ ...req.body, createdBy: req.user._id });

    // if (payment.type === 'customer_payment' && payment.amcLinked && payment.customer) {
    //   await Customer.findByIdAndUpdate(payment.customer, {
    //     'amc.status': payment.status === 'Paid' ? 'active' : 'expiring',
    //   });
    // }
    
    const populated = await payment.populate('customer', 'name phone productType');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    ).populate('customer', 'name phone productType');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Payment.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET payments by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const payments = await Payment.find({
      customer:  req.params.customerId,
      createdBy: req.user._id,
    }).sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
