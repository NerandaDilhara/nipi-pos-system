import { useState, useEffect, useRef } from 'react';
import { productAPI, discountAPI, saleAPI } from '../services/api';

function POS() {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const res = await discountAPI.getAll();
      setDiscounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const res = await productAPI.getByBarcode(barcode);
      const product = res.data;

      const existingItem = cart.find(item => item._id === product._id);
      if (existingItem) {
        setCart(cart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        ));
      } else {
        setCart([...cart, { ...product, quantity: 1, total: product.price }]);
      }
      setBarcode('');
    } catch (err) {
      alert('Product not found!');
      setBarcode('');
    }
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setCart(cart.map(item =>
      item._id === id
        ? { ...item, quantity: newQty, total: newQty * item.price }
        : item
    ));
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item._id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscount = () => {
    if (!selectedDiscount) return 0;
    const subtotal = calculateSubtotal();
    if (selectedDiscount.type === 'percentage') {
      return (subtotal * selectedDiscount.value) / 100;
    }
    return selectedDiscount.value;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const calculateChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    const total = calculateTotal();
    return paid - total;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const total = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;

    if (paymentMethod === 'cash' && paid < total) {
      alert('Insufficient payment amount!');
      return;
    }

    try {
      const saleData = {
        items: cart.map(item => ({
          product: item._id,
          name: item.name,
          barcode: item.barcode,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal: calculateSubtotal(),
        discount: selectedDiscount ? {
          name: selectedDiscount.name,
          type: selectedDiscount.type,
          value: selectedDiscount.value,
          amount: calculateDiscount()
        } : null,
        total: total,
        paymentMethod,
        amountPaid: paymentMethod === 'cash' ? paid : total,
        change: paymentMethod === 'cash' ? calculateChange() : 0
      };

      const res = await saleAPI.create(saleData);
      printReceipt(res.data);
      
      // Reset
      setCart([]);
      setSelectedDiscount(null);
      setAmountPaid('');
      setPaymentMethod('cash');
      alert('Sale completed successfully!');
    } catch (err) {
      alert('Error processing sale!');
      console.error(err);
    }
  };

  const printReceipt = (sale) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; width: 280px; margin: 20px auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 20px; }
            .header p { margin: 2px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .items { margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NIPI 9M Fashion</h1>
            <p>Your Trusted Fashion Store</p>
            <p>Tel: +94 XX XXX XXXX</p>
            <p>Receipt: ${sale.receiptNumber}</p>
            <p>Date: ${new Date(sale.createdAt).toLocaleString()}</p>
          </div>
          <div class="divider"></div>
          <div class="items">
            ${sale.items.map(item => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>Rs. ${item.total.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="divider"></div>
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Rs. ${sale.subtotal.toFixed(2)}</span>
            </div>
            ${sale.discount ? `
              <div class="total-row">
                <span>Discount (${sale.discount.name}):</span>
                <span>- Rs. ${sale.discount.amount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="divider"></div>
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>Rs. ${sale.total.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Payment (${sale.paymentMethod}):</span>
              <span>Rs. ${sale.amountPaid.toFixed(2)}</span>
            </div>
            ${sale.change > 0 ? `
              <div class="total-row">
                <span>Change:</span>
                <span>Rs. ${sale.change.toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
          <div class="divider"></div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>Visit us again soon!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Side - Products */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Scan Product</h2>
          <form onSubmit={handleBarcodeSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode..."
                className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Qty</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item._id} className="border-b">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">Rs. {item.price.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                        className="w-16 border rounded px-2 py-1"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-2">Rs. {item.total.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Side - Payment */}
      <div>
        <div className="bg-white rounded-lg shadow p-6 sticky top-4">
          <h2 className="text-2xl font-bold mb-4">Payment</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Discount</label>
            <select
              value={selectedDiscount?._id || ''}
              onChange={(e) => {
                const discount = discounts.find(d => d._id === e.target.value);
                setSelectedDiscount(discount || null);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">No Discount</option>
              {discounts.map(discount => (
                <option key={discount._id} value={discount._id}>
                  {discount.name} ({discount.type === 'percentage' ? `${discount.value}%` : `Rs. ${discount.value}`})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-2 rounded ${paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 rounded ${paymentMethod === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Card
              </button>
              <button
                onClick={() => setPaymentMethod('mobile')}
                className={`flex-1 py-2 rounded ${paymentMethod === 'mobile' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Mobile
              </button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount Paid</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                className="w-full border rounded px-3 py-2"
                step="0.01"
              />
            </div>
          )}

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>- Rs. {calculateDiscount().toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>Rs. {calculateTotal().toFixed(2)}</span>
            </div>
            {paymentMethod === 'cash' && amountPaid && (
              <div className="flex justify-between text-blue-600">
                <span>Change:</span>
                <span>Rs. {calculateChange().toFixed(2)}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold text-lg"
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}

export default POS;