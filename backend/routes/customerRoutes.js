const express   = require('express');
const router    = express.Router();
const Customer  = require('../models/Customer');
const Payment   = require('../models/Payment');
const protect   = require('../middleware/Auth');
const sendEmail = require('../utils/SendEmail');

router.use(protect);

// GET all
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create customer — also creates payment records
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };

    // AMC status calculation
    if (data.amc && data.amc.endDate) {
      const today    = new Date();
      const end      = new Date(data.amc.endDate);
      const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0)       data.amc.status = 'expired';
      else if (daysLeft <= 30) data.amc.status = 'expiring';
      else                     data.amc.status = 'active';
    }

    // Remove installationPayment before saving customer
    const installationPayment = data.installationPayment;
    delete data.installationPayment;

    // Create customer
    const customer = new Customer(data);
    await customer.save();

    // ── Always create installation payment record ──────────────────────────
    if (installationPayment) {
      await Payment.create({
        createdBy:     req.user._id,
        type:          'customer_payment',
        customer:      customer._id,
        amcLinked:     false,
        description:   `Installation — ${customer.name} (${customer.productType})`,
        amount:        installationPayment.amount,
        paymentMode:   installationPayment.paymentMode || 'Cash',
        isSplit:       installationPayment.isSplit || false,
        splitPayments: installationPayment.splitPayments || [],
        date:          data.installDate || new Date(),
        status:        installationPayment.status || 'Paid',
        paidAmount:    installationPayment.paidAmount || 0,
        notes:         `Installation charge — ${data.hasAMC ? 'with AMC' : 'no AMC'}`,
      });
    }

    // ── AMC payment — only if hasAMC ───────────────────────────────────────
    if (data.hasAMC && data.amc?.amount && data.amc?.startDate) {
      await Payment.create({
        createdBy:     req.user._id,
        type:          'customer_payment',
        customer:      customer._id,
        amcLinked:     true,
        description:   `AMC Payment — ${customer.name} (${customer.productType})`,
        amount:        data.amc.amount,
        paymentMode:   data.amc.isSplit ? 'Split' : (data.amc.paymentMode || 'Cash'),
        isSplit:       data.amc.isSplit || false,
        splitPayments: data.amc.isSplit ? (data.amc.splitPayments || []) : [],
        date:          data.amc.startDate,
        status:        'Paid',
        paidAmount:    data.amc.amount,
        notes:         'AMC payment',
      });
    }

    res.status(201).json(customer);               
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await Customer.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    await Payment.deleteMany({ customer: req.params.id, createdBy: req.user._id });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST renew AMC — also creates a payment record (supports split payments)
router.post('/:id/renew', async (req, res) => {
  try {
    const { startDate, endDate, amount, paymentMode, isSplit, splitPayments } = req.body;

    const today    = new Date();
    const end      = new Date(endDate);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    let status = 'active';
    if (daysLeft <= 0)       status = 'expired';
    else if (daysLeft <= 30) status = 'expiring';

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      {
        'amc.startDate':   startDate,
        'amc.endDate':     endDate,
        'amc.amount':      amount,
        'amc.paymentMode': isSplit ? 'Split' : (paymentMode || 'Cash'),
        'amc.status':      status,
      },
      { new: true }
    );

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // ── Create renewal payment record ──────────────────────────────────────
    // ✅ Fixed: uses destructured req.body variables, not `data` (which doesn't exist here)
    if (amount && startDate) {
      await Payment.create({
        createdBy:     req.user._id,
        type:          'customer_payment',
        customer:      customer._id,
        amcLinked:     true,
        description:   `AMC Renewal — ${customer.name} (${customer.productType})`,
        amount:        amount,
        paymentMode:   isSplit ? 'Split' : (paymentMode || 'Cash'),
        isSplit:       isSplit || false,
        splitPayments: isSplit ? (splitPayments || []) : [],
        date:          startDate,
        status:        'Paid',
        paidAmount:    amount,
        notes:         'AMC renewal payment',
      });
    }

    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST send reminder
router.post('/:id/remind', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (!customer.amc?.email) return res.status(400).json({ message: 'No email on file' });

    const end      = new Date(customer.amc.endDate);
    const today    = new Date();
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    await sendEmail({
      to:      customer.amc.email,
      subject: `⚠️ AMC Reminder — ${customer.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1d4ed8;">💧 Water AMC Reminder</h2>
          <p>Dear <strong>${customer.name}</strong>,</p>
          <p>Your AMC for <strong>${customer.productType}</strong> is expiring in
            <strong style="color:#ef4444;">${daysLeft} days</strong>.</p>
          <p>Please renew to avoid service interruption.</p>
          <p style="color:#6b7280;font-size:13px;">— Water AMC System, Jaipur 💧</p>
        </div>
      `,
    });

    res.json({ message: `Reminder sent to ${customer.amc.email}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;