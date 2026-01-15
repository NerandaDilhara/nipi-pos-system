const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  receiptNumber: { type: String, unique: true, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    barcode: String,
    quantity: Number,
    price: Number,
    total: Number
  }],
  subtotal: { type: Number, required: true },
  discount: {
    name: String,
    type: String,
    value: Number,
    amount: Number
  },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile'], required: true },
  amountPaid: { type: Number, required: true },
  change: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', saleSchema);