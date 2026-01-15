const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get sale by receipt number
router.get('/:receiptNumber', async (req, res) => {
  try {
    const sale = await Sale.findOne({ receiptNumber: req.params.receiptNumber });
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create sale
router.post('/', async (req, res) => {
  try {
    // Generate receipt number
    const count = await Sale.countDocuments();
    const receiptNumber = `NIPI${String(count + 1).padStart(6, '0')}`;
    
    const sale = new Sale({
      ...req.body,
      receiptNumber
    });
    
    // Update product stock
    for (const item of req.body.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }
    
    const newSale = await sale.save();
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;