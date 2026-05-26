// const express  = require('express');
// const router   = express.Router();
// const Customer = require('../models/Customer');

// // GET all customers
// router.get('/', async (req, res) => {
//   try {
//     const customers = await Customer.find().sort({ createdAt: -1 });
//     res.json(customers);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // GET single customer
// router.get('/:id', async (req, res) => {
//   try {
//     const customer = await Customer.findById(req.params.id);
//     if (!customer) return res.status(404).json({ message: 'Customer not found' });
//     res.json(customer);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // POST create customer
// router.post('/', async (req, res) => {
//   try {
//     console.log('Received data:', req.body); // ADD THIS LINE
//     const customer = new Customer(req.body);
//     await customer.save();
//     res.status(201).json(customer);
//   } catch (err) {
//     console.log('Validation error:', err.message); // ADD THIS LINE
//     res.status(400).json({ message: err.message });
//   }
// });

// // PUT update customer
// router.put('/:id', async (req, res) => {
//   try {
//     const customer = await Customer.findByIdAndUpdate(
//       req.params.id, req.body, { new: true, runValidators: true }
//     );
//     if (!customer) return res.status(404).json({ message: 'Customer not found' });
//     res.json(customer);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// // DELETE customer
// router.delete('/:id', async (req, res) => {
//   try {
//     await Customer.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Customer deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;

const express  = require('express');
const router   = express.Router();
const Customer = require('../models/Customer');
const protect  = require('../middleware/auth'); 

// Protect all routes below
router.use(protect); 

// GET all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Calculate AMC status
    if (data.amc && data.amc.endDate) {
      const today    = new Date();
      const end      = new Date(data.amc.endDate);
      const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0)       data.amc.status = 'expired';
      else if (daysLeft <= 30) data.amc.status = 'expiring';
      else                     data.amc.status = 'active';
    }

    const customer = new Customer(data);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.log('Validation error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const sendEmail = require('../utils/sendEmail');

// POST /api/customers/:id/remind
router.post('/:id/remind', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (!customer.amc?.email) return res.status(400).json({ message: 'No email on file for this customer' });

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
            <strong style="color:#ef4444;">${daysLeft} days</strong>
            on <strong>${customer.amc.endDate.toISOString().split('T')[0]}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="background:#e0e7ff;">
              <td style="padding:8px 12px;font-weight:bold;">AMC End Date</td>
              <td style="padding:8px 12px;">${customer.amc.endDate.toISOString().split('T')[0]}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;">Amount</td>
              <td style="padding:8px 12px;">₹${customer.amc.amount?.toLocaleString()}</td>
            </tr>
            <tr style="background:#e0e7ff;">
              <td style="padding:8px 12px;font-weight:bold;">Product</td>
              <td style="padding:8px 12px;">${customer.productType}</td>
            </tr>
          </table>
          <p>Please contact us to renew your AMC.</p>
          <p style="color:#6b7280;font-size:13px;">— Water AMC System, Jaipur 💧</p>
        </div>
      `,
    });

    res.json({ message: `Reminder sent to ${customer.amc.email}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customers/:id/renew — renew AMC
router.post('/:id/renew', async (req, res) => {
  try {
    const { startDate, endDate, amount, paymentMode } = req.body;

    const today    = new Date();
    const end      = new Date(endDate);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    let status = 'active';
    if (daysLeft <= 0)       status = 'expired';
    else if (daysLeft <= 30) status = 'expiring';

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        'amc.startDate':   startDate,
        'amc.endDate':     endDate,
        'amc.amount':      amount,
        'amc.paymentMode': paymentMode,
        'amc.status':      status,
      },
      { new: true }
    );

    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
module.exports = router;