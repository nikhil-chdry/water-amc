const express      = require('express');
const router       = express.Router();
const Customer     = require('../models/Customer');
const Payment      = require('../models/Payment');
const ServiceVisit = require('../models/Servicevisit');
const protect      = require('../middleware/Auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ customers: [], payments: [], visits: [] });
    }

    const query    = q.trim();
    const regex    = new RegExp(query, 'i');
    const userId   = req.user._id;

    // Search customers
    const customers = await Customer.find({
      createdBy: userId,
      $or: [
        { name:        regex },
        { phone:       regex },
        { address:     regex },
        { productType: regex },
      ],
    }).limit(5);

    // Search payments
    const payments = await Payment.find({
      createdBy: userId,
      $or: [
        { description: regex },
        { partyName:   regex },
        { notes:       regex },
      ],
    }).populate('customer', 'name').limit(5);

    // Search service visits
    const visits = await ServiceVisit.find({
      createdBy: userId,
      $or: [
        { complaint:  regex },
        { parts:      regex },
        { technician: regex },
        { notes:      regex },
      ],
    }).populate('customer', 'name phone').limit(5);

    res.json({ customers, payments, visits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
