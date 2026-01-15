import { useState, useEffect } from 'react';
import { saleAPI } from '../services/api';

function Sales() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const res = await saleAPI.getAll();
      setSales(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const viewDetails = (sale) => {
    setSelectedSale(sale);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Sales History</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
          <p className="text-3xl font-bold text-blue-600">{sales.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            Rs. {sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Average Sale</h3>
          <p className="text-3xl font-bold text-purple-600">
            Rs. {sales.length > 0 ? (sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sales.map(sale => (
              <tr key={sale._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{sale.receiptNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(sale.createdAt).toLocaleDateString()}
                  <br />
                  <span className="text-xs text-gray-500">
                    {new Date(sale.createdAt).toLocaleTimeString()}
                  </span>
                </td>
                <td className="px-6 py-4">{sale.items.length}</td>
                <td className="px-6 py-4 whitespace-nowrap">Rs. {sale.total.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">
                    {sale.paymentMethod}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => viewDetails(sale)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Sale Details</h2>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Receipt Number</p>
              <p className="font-bold">{selectedSale.receiptNumber}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Date & Time</p>
              <p>{new Date(selectedSale.createdAt).toLocaleString()}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-bold mb-2">Items</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-left">Qty</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">Rs. {item.price.toFixed(2)}</td>
                      <td className="px-4 py-2">Rs. {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.discount && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({selectedSale.discount.name}):</span>
                  <span>- Rs. {selectedSale.discount.amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>Rs. {selectedSale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{selectedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span>Rs. {selectedSale.amountPaid.toFixed(2)}</span>
              </div>
              {selectedSale.change > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Change:</span>
                  <span>Rs. {selectedSale.change.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;