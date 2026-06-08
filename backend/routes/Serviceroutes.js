const express       = require('express');
const router        = express.Router();
const ServiceVisit  = require('../models/Servicevisit');
const protect       = require('../middleware/Auth');

router.use(protect);

// GET all visits — only this user's
router.get('/', async (req, res) => {
  try {
    const visits = await ServiceVisit.find({ createdBy: req.user._id })
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
    const visits = await ServiceVisit.find({
      customer:  req.params.customerId,
      createdBy: req.user._id,
    }).sort({ date: -1 });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create — attach createdBy
router.post('/', async (req, res) => {
  try {
    const visit = await ServiceVisit.create({ ...req.body, createdBy: req.user._id });
    const populated = await visit.populate('customer', 'name phone productType');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update — only owner
router.put('/:id', async (req, res) => {
  try {
    const visit = await ServiceVisit.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    ).populate('customer', 'name phone productType');
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    res.json(visit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE — only owner
router.delete('/:id', async (req, res) => {
  try {
    await ServiceVisit.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    res.json({ message: 'Visit deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
