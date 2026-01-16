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
    name: { type: String, required: false },
    type: { type: String, required: false },
    value: { type: Number, required: false },
    amount: { type: Number, required: false }
  },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile'], required: true },
  amountPaid: { type: Number, required: true },
  change: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', saleSchema);