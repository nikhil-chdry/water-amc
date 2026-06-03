const express  = require('express');
const router   = express.Router();
const Customer = require('../models/Customer');
const protect  = require('../middleware/auth');
const upload   = require('../middleware/upload');
const fs       = require('fs');
const path     = require('path');

router.use(protect);

// POST upload bill for a customer
router.post('/:customerId', upload.single('bill'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const customer = await Customer.findOne({
      _id:       req.params.customerId,
      createdBy: req.user._id,
    });

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const bill = {
      url:      `/uploads/bills/${req.file.filename}`,
      filename:  req.file.filename,
      note:      req.body.note || '',
    };

    customer.bills.push(bill);
    await customer.save();

    res.status(201).json({ bill: customer.bills[customer.bills.length - 1] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a bill
router.delete('/:customerId/:billId', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id:       req.params.customerId,
      createdBy: req.user._id,
    });

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const bill = customer.bills.id(req.params.billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'uploads', 'bills', bill.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    customer.bills.pull(req.params.billId);
    await customer.save();

    res.json({ message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;