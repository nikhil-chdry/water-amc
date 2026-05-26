const express       = require('express');
const router        = express.Router();
const ServiceVisit  = require('../models/ServiceVisit');
const protect       = require('../middleware/auth');

router.use(protect);

// GET all visits
router.get('/', async (req, res) => {
  try {
    const visits = await ServiceVisit.find()
      .populate('customer', 'name phone productType')
      .sort({ date: -1 });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET visits by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const visits = await ServiceVisit.find({ customer: req.params.customerId })
      .sort({ date: -1 });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create visit
router.post('/', async (req, res) => {
  try {
    const visit = await ServiceVisit.create(req.body);
    const populated = await visit.populate('customer', 'name phone productType');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update visit
router.put('/:id', async (req, res) => {
  try {
    const visit = await ServiceVisit.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    ).populate('customer', 'name phone productType');
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    res.json(visit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE visit
router.delete('/:id', async (req, res) => {
  try {
    await ServiceVisit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Visit deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;