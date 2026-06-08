const express    = require('express');
const router     = express.Router();
const Customer   = require('../models/Customer');
const protect    = require('../middleware/Auth');
const { upload, uploadToCloudinary, cloudinary } = require('../middleware/Upload');

router.use(protect);

// POST upload bill
router.post('/:customerId', upload.single('bill'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const customer = await Customer.findOne({
      _id:       req.params.customerId,
      createdBy: req.user._id,
    });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // Upload buffer to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'water-amc/bills');

    const bill = {
      url:       result.secure_url,  // Cloudinary HTTPS URL
      publicId:  result.public_id,   // For deletion later
      filename:  req.file.originalname,
      note:      req.body.note || '',
    };

    customer.bills.push(bill);
    await customer.save();

    res.status(201).json({ bill: customer.bills[customer.bills.length - 1] });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE bill
router.delete('/:customerId/:billId', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id:       req.params.customerId,
      createdBy: req.user._id,
    });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const bill = customer.bills.id(req.params.billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    // Delete from Cloudinary
    if (bill.publicId) {
      await cloudinary.uploader.destroy(bill.publicId);
    }

    customer.bills.pull(req.params.billId);
    await customer.save();

    res.json({ message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;