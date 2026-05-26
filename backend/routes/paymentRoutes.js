const express  = require('express');
const router   = express.Router();
const Payment  = require('../models/Payment');
const Customer = require('../models/Customer');
const protect  = require('../middleware/auth');

router.use(protect);

// GET all payments with summary stats
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('customer', 'name phone productType')
      .sort({ date: -1 });

    // Summary stats
    const customerPayments = payments.filter(p => p.type === 'customer_payment');
    const rawMaterials     = payments.filter(p => p.type === 'raw_material');
    const supplierDues     = payments.filter(p => p.type === 'supplier_due');

    const totalCollected = customerPayments
      .filter(p => p.status === 'Paid')
      .reduce((s, p) => s + p.amount, 0);

    const totalDue = customerPayments
      .filter(p => p.status === 'Due')
      .reduce((s, p) => s + p.amount, 0);

    const totalSpent = rawMaterials
      .reduce((s, p) => s + p.amount, 0);

    const totalOwed = supplierDues
      .filter(p => p.status === 'Due')
      .reduce((s, p) => s + p.amount, 0);

    // By payment mode
    const byMode = {
      Cash:          customerPayments.filter(p => p.paymentMode === 'Cash' && p.status === 'Paid').reduce((s, p) => s + p.amount, 0),
      UPI:           customerPayments.filter(p => p.paymentMode === 'UPI' && p.status === 'Paid').reduce((s, p) => s + p.amount, 0),
      'Bank Transfer': customerPayments.filter(p => p.paymentMode === 'Bank Transfer' && p.status === 'Paid').reduce((s, p) => s + p.amount, 0),
      Cheque:        customerPayments.filter(p => p.paymentMode === 'Cheque' && p.status === 'Paid').reduce((s, p) => s + p.amount, 0),
    };

    res.json({ payments, stats: { totalCollected, totalDue, totalSpent, totalOwed, byMode } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create payment
router.post('/', async (req, res) => {
  try {
    const payment = await Payment.create(req.body);

    // If linked to customer AMC, update customer AMC status
    if (payment.type === 'customer_payment' && payment.amcLinked && payment.customer) {
      await Customer.findByIdAndUpdate(payment.customer, {
        'amc.status': payment.status === 'Paid' ? 'active' : 'expiring',
      });
    }

    const populated = await payment.populate('customer', 'name phone productType');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    ).populate('customer', 'name phone productType');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE payment
router.delete('/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;