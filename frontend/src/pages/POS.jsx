import { useState, useEffect, useRef } from 'react';
import { productAPI, discountAPI, saleAPI } from '../services/api';

function POS() {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      const res = await discountAPI.getAll();
      setDiscounts(res.data);
    } catch (err) {
      console.error('Error loading discounts:', err);
    }
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const res = await productAPI.getByBarcode(barcode);
      const product = res.data;

      // Check stock
      if (product.stock <= 0) {
        showError(`${product.name} is out of stock!`);
        setBarcode('');
        return;
      }

      const existingItem = cart.find(item => item._id === product._id);
      if (existingItem) {
        // Check if adding more exceeds stock
        if (existingItem.quantity + 1 > product.stock) {
          showError(`Only ${product.stock} items available in stock!`);
          setBarcode('');
          return;
        }
        setCart(cart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        ));
      } else {
        setCart([...cart, { ...product, quantity: 1, total: product.price }]);
      }
      showSuccess(`${product.name} added to cart!`);
      setBarcode('');
      
      // Keep focus on barcode input
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Error finding product:', err);
      showError('Product not found! Please check the barcode.');
      setBarcode('');
    }
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    
    const item = cart.find(i => i._id === id);
    if (newQty > item.stock) {
      showError(`Only ${item.stock} items available in stock!`);
      return;
    }

    setCart(cart.map(item =>
      item._id === id
        ? { ...item, quantity: newQty, total: newQty * item.price }
        : item
    ));
  };

  const removeItem = (id) => {
    const item = cart.find(i => i._id === id);
    if (window.confirm(`Remove ${item.name} from cart?`)) {
      setCart(cart.filter(item => item._id !== id));
      showSuccess('Item removed from cart');
    }
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear entire cart?')) {
      setCart([]);
      showSuccess('Cart cleared');
    }
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
    return Math.max(0, paid - total);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showError('Cart is empty! Add products first.');
      return;
    }

    const total = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;

    if (paymentMethod === 'cash') {
      if (!amountPaid || paid <= 0) {
        showError('Please enter amount paid!');
        return;
      }
      if (paid < total) {
        showError(`Insufficient payment! Need Rs. ${(total - paid).toFixed(2)} more.`);
        return;
      }
    }

    setIsProcessing(true);

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
        total: total,
        paymentMethod,
        amountPaid: paymentMethod === 'cash' ? paid : total,
        change: paymentMethod === 'cash' ? calculateChange() : 0
      };

      // Only add discount if one is selected
      if (selectedDiscount) {
        saleData.discount = {
          name: selectedDiscount.name,
          type: selectedDiscount.type,
          value: selectedDiscount.value,
          amount: calculateDiscount()
        };
      }

      console.log('Sending sale data:', saleData);
      const res = await saleAPI.create(saleData);
      console.log('Sale response:', res.data);
      
      // Print receipt
      printReceipt(res.data);
      
      // Reset
      setCart([]);
      setSelectedDiscount(null);
      setAmountPaid('');
      setPaymentMethod('cash');
      showSuccess('Sale completed successfully!');
      
      // Focus back to barcode input
      setTimeout(() => barcodeInputRef.current?.focus(), 1000);
    } catch (err) {
      console.error('Error processing sale:', err);
      console.error('Error details:', err.response?.data);
      
      let errorMsg = 'Error processing sale! ';
      if (err.response?.data?.message) {
        errorMsg += err.response.data.message;
      } else if (err.message) {
        errorMsg += err.message;
      } else {
        errorMsg += 'Please check if backend is running.';
      }
      showError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (sale) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.receiptNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              width: 80mm; 
              margin: 0 auto; 
              padding: 10mm;
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 15px; 
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 { 
              font-size: 24px; 
              font-weight: bold;
              margin-bottom: 5px;
            }
            .header p { 
              margin: 3px 0; 
              font-size: 12px; 
            }
            .divider { 
              border-top: 1px dashed #000; 
              margin: 10px 0; 
            }
            .info { 
              margin: 10px 0; 
              font-size: 12px;
            }
            .info div {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .items { 
              margin: 15px 0; 
            }
            .item { 
              margin: 8px 0; 
              font-size: 13px;
            }
            .item-name {
              font-weight: bold;
            }
            .item-details {
              display: flex;
              justify-content: space-between;
              margin-top: 2px;
              font-size: 12px;
            }
            .totals { 
              margin-top: 15px; 
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 5px 0;
              font-size: 13px;
            }
            .grand-total { 
              font-weight: bold; 
              font-size: 18px;
              border-top: 1px solid #000;
              border-bottom: 2px double #000;
              padding: 8px 0;
              margin: 8px 0;
            }
            .payment-info {
              margin: 10px 0;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              font-size: 11px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .footer p {
              margin: 5px 0;
            }
            @media print {
              body { 
                width: 80mm;
                margin: 0;
                padding: 5mm;
              }
              .payment-info {
                background: #e0e0e0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NIPI 9M Fashion</h1>
            <p>Your Trusted Fashion Store</p>
            <p>Tel: +94 XX XXX XXXX</p>
            <p>Address: Your Address Here</p>
          </div>
          
          <div class="info">
            <div>
              <strong>Receipt No:</strong>
              <span>${sale.receiptNumber}</span>
            </div>
            <div>
              <strong>Date:</strong>
              <span>${new Date(sale.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <strong>Time:</strong>
              <span>${new Date(sale.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div class="divider"></div>
          
          <div class="items">
            <strong>ITEMS:</strong>
            ${sale.items.map(item => `
              <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                  <span>${item.quantity} x Rs. ${item.price.toFixed(2)}</span>
                  <strong>Rs. ${item.total.toFixed(2)}</strong>
                </div>
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
              <div class="total-row" style="color: green;">
                <span>Discount (${sale.discount.name}):</span>
                <span>- Rs. ${sale.discount.amount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>Rs. ${sale.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="payment-info">
            <div class="total-row">
              <span>Payment Method:</span>
              <strong style="text-transform: uppercase;">${sale.paymentMethod}</strong>
            </div>
            <div class="total-row">
              <span>Amount Paid:</span>
              <strong>Rs. ${sale.amountPaid.toFixed(2)}</strong>
            </div>
            ${sale.change > 0 ? `
              <div class="total-row" style="font-size: 16px; color: blue;">
                <span>Change:</span>
                <strong>Rs. ${sale.change.toFixed(2)}</strong>
              </div>
            ` : ''}
          </div>

          <div class="divider"></div>
          
          <div class="footer">
            <p><strong>Thank you for shopping with us!</strong></p>
            <p>Visit us again soon!</p>
            <p>NIPI 9M Fashion</p>
            <p style="margin-top: 12px;">Powered by NDK ©</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              // Auto close after printing (optional)
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Alert Messages */}
      {errorMessage && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">⚠️ Error</p>
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
          <p className="font-bold">✓ Success</p>
          <p>{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Products */}
        <div className="lg:col-span-2">
          <div className="bg-gray-200 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold text-blue-600">🛒 Scan Product</h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                >
                  Clear Cart
                </button>
              )}
            </div>

            <form onSubmit={handleBarcodeSubmit} className="mb-6">
              <div className="flex gap-3">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="🔍 Scan or enter barcode here..."
                  className="flex-1 border-2 border-blue-300 rounded-lg px-6 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg"
                >
                  ➕ Add
                </button>
              </div>
            </form>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-6xl mb-4">🛍️</p>
                <p className="text-xl">Cart is empty</p>
                <p className="text-sm">Scan a product to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-lg">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Product</th>
                      <th className="px-4 py-3 text-right font-bold">Price</th>
                      <th className="px-4 py-3 text-center font-bold">Quantity</th>
                      <th className="px-4 py-3 text-right font-bold">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-4 font-medium">{item.name}</td>
                        <td className="px-4 py-4 text-right">Rs. {item.price.toFixed(2)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="bg-gray-300 hover:bg-gray-400 w-8 h-8 rounded font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                              className="w-16 border-2 rounded px-2 py-1 text-center font-bold"
                              min="1"
                            />
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="bg-gray-300 hover:bg-gray-400 w-8 h-8 rounded font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-blue-600">
                          Rs. {item.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => removeItem(item._id)}
                            className="text-red-600 hover:text-red-800 font-bold text-xl"
                            title="Remove item"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Payment */}
        <div>
          <div className="bg-gray-300 rounded-lg shadow-lg p-6 sticky top-4">
            <h2 className="text-3xl font-bold mb-6 text-green-600">💳 Payment</h2>
            
            {/* Discount Selection */}
            <div className="mb-6">
              <label className="block text-lg font-bold mb-2">🏷️ Apply Discount</label>
              <select
                value={selectedDiscount?._id || ''}
                onChange={(e) => {
                  const discount = discounts.find(d => d._id === e.target.value);
                  setSelectedDiscount(discount || null);
                }}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">No Discount</option>
                {discounts.map(discount => (
                  <option key={discount._id} value={discount._id}>
                    {discount.name} - {discount.type === 'percentage' ? `${discount.value}%` : `Rs. ${discount.value}`} OFF
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-lg font-bold mb-2">💰 Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 rounded-lg font-bold text-lg transition ${
                    paymentMethod === 'cash' 
                      ? 'bg-green-600 text-white shadow-lg scale-105' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`py-3 rounded-lg font-bold text-lg transition ${
                    paymentMethod === 'card' 
                      ? 'bg-green-600 text-white shadow-lg scale-105' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  💳 Card
                </button>
                <button
                  onClick={() => setPaymentMethod('mobile')}
                  className={`py-3 rounded-lg font-bold text-lg transition ${
                    paymentMethod === 'mobile' 
                      ? 'bg-green-600 text-white shadow-lg scale-105' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  📱 Mobile
                </button>
              </div>
            </div>

            {/* Cash Payment Input */}
            {paymentMethod === 'cash' && (
              <div className="mb-6">
                <label className="block text-lg font-bold mb-2">💵 Amount Received</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                  step="0.01"
                />
                
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setAmountPaid(amount.toString())}
                      className="bg-blue-100 hover:bg-blue-200 py-2 rounded text-sm font-bold"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-bold">Rs. {calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg text-green-600">
                <span>Discount:</span>
                <span className="font-bold">- Rs. {calculateDiscount().toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 flex justify-between font-bold text-2xl text-blue-600">
                <span>TOTAL:</span>
                <span>Rs. {calculateTotal().toFixed(2)}</span>
              </div>
              {paymentMethod === 'cash' && amountPaid && (
                <>
                  <div className="flex justify-between text-lg">
                    <span>Paid:</span>
                    <span className="font-bold">Rs. {parseFloat(amountPaid).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-green-600">
                    <span>Change:</span>
                    <span>Rs. {calculateChange().toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
              className={`w-full py-4 rounded-lg font-bold text-xl shadow-lg transition ${
                isProcessing || cart.length === 0
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-600 text-white'
              }`}
            >
              {isProcessing ? '⏳ Processing...' : '✓ Complete Sale & Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POS;