const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');

// Get all active discounts
router.get('/', async (req, res) => {
  try {
    const discounts = await Discount.find({ active: true });
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all discounts (including inactive)
router.get('/all', async (req, res) => {
  try {
    const discounts = await Discount.find();
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create discount
router.post('/', async (req, res) => {
  const discount = new Discount(req.body);
  try {
    const newDiscount = await discount.save();
    res.status(201).json(newDiscount);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update discount
router.put('/:id', async (req, res) => {
  try {
    const discount = await Discount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(discount);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete discount
router.delete('/:id', async (req, res) => {
  try {
    await Discount.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discount deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;