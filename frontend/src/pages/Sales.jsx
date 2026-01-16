import { useState, useEffect } from 'react';
import { saleAPI } from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Sales() {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [viewMode, setViewMode] = useState('day'); // day, week, month, custom
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [chartType, setChartType] = useState('bar'); // bar, pie, line
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await saleAPI.getAll();
      setSales(res.data);
    } catch (err) {
      console.error('Failed to load sales:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const viewDetails = (sale) => {
    setSelectedSale(sale);
  };

  // Filter sales based on view mode
  const getFilteredSales = () => {
    if (!sales || sales.length === 0) return [];

    const now = new Date();
    let startDate;

    switch (viewMode) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        return sales.filter(sale => new Date(sale.createdAt) >= startDate);
      
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        return sales.filter(sale => new Date(sale.createdAt) >= startDate);
      
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        return sales.filter(sale => new Date(sale.createdAt) >= startDate);
      
      case 'custom':
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        return sales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate >= start && saleDate <= end;
        });
      
      default:
        return sales;
    }
  };

  const filteredSales = getFilteredSales();

  // Calculate statistics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const averageSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  const totalItems = filteredSales.reduce((sum, sale) => 
    sum + (sale.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0
  );

  // Payment method breakdown
  const paymentStats = filteredSales.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'unknown';
    acc[method] = (acc[method] || 0) + (sale.total || 0);
    return acc;
  }, {});

  const paymentChartData = Object.entries(paymentStats).map(([method, amount]) => ({
    name: method.charAt(0).toUpperCase() + method.slice(1),
    value: amount,
    count: filteredSales.filter(s => s.paymentMethod === method).length
  }));

  // Daily sales data for line/bar chart
  const getDailySales = () => {
    const dailyData = {};
    filteredSales.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, count: 0 };
      }
      dailyData[date].revenue += sale.total || 0;
      dailyData[date].count += 1;
    });
    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const dailySalesData = getDailySales();

  // Top selling products
  const getTopProducts = () => {
    const productStats = {};
    filteredSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          if (!productStats[item.name]) {
            productStats[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          productStats[item.name].quantity += item.quantity || 0;
          productStats[item.name].revenue += item.total || 0;
        });
      }
    });
    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const topProducts = getTopProducts();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  // Print report
  const printReport = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report - ${viewMode.toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
            }
            .header h1 { font-size: 28px; margin-bottom: 5px; }
            .header p { color: #666; margin: 5px 0; }
            .summary { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 20px; 
              margin: 30px 0;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            .summary-item { padding: 15px; background: white; border-radius: 5px; }
            .summary-item h3 { 
              font-size: 12px; 
              color: #666; 
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .summary-item p { font-size: 24px; font-weight: bold; color: #000; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            thead { background: #f5f5f5; }
            th, td { 
              padding: 12px; 
              text-align: left; 
              border-bottom: 1px solid #ddd;
            }
            th { font-weight: bold; font-size: 12px; text-transform: uppercase; }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .payment-stats {
              margin: 30px 0;
              padding: 20px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            .payment-stats h3 {
              margin-bottom: 15px;
              font-size: 16px;
            }
            .payment-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #ddd;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NIPI 9M Fashion</h1>
            <p>Sales Report - ${viewMode.toUpperCase()}</p>
            ${viewMode === 'custom' 
              ? `<p>Period: ${dateRange.start} to ${dateRange.end}</p>`
              : `<p>Generated: ${new Date().toLocaleString()}</p>`
            }
          </div>

          <div class="summary">
            <div class="summary-item">
              <h3>Total Sales</h3>
              <p>${filteredSales.length}</p>
            </div>
            <div class="summary-item">
              <h3>Total Revenue</h3>
              <p>Rs. ${totalRevenue.toFixed(2)}</p>
            </div>
            <div class="summary-item">
              <h3>Average Sale</h3>
              <p>Rs. ${averageSale.toFixed(2)}</p>
            </div>
            <div class="summary-item">
              <h3>Total Items Sold</h3>
              <p>${totalItems}</p>
            </div>
          </div>

          <div class="payment-stats">
            <h3>Payment Methods Breakdown</h3>
            ${paymentChartData.map(pm => `
              <div class="payment-item">
                <span><strong>${pm.name}:</strong> ${pm.count} transactions</span>
                <strong>Rs. ${pm.value.toFixed(2)}</strong>
              </div>
            `).join('')}
          </div>

          <h2 style="margin: 30px 0 15px 0;">Sales Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date & Time</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => `
                <tr>
                  <td>${sale.receiptNumber || 'N/A'}</td>
                  <td>${new Date(sale.createdAt).toLocaleString()}</td>
                  <td>${sale.items?.length || 0}</td>
                  <td style="text-transform: capitalize;">${sale.paymentMethod || 'N/A'}</td>
                  <td><strong>Rs. ${(sale.total || 0).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${topProducts.length > 0 ? `
            <h2 style="margin: 30px 0 15px 0;">Top 5 Products</h2>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map(product => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td><strong>Rs. ${product.revenue.toFixed(2)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            <p>NIPI 9M Fashion - Point of Sale System</p>
            <p>This is an automatically generated report</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Receipt #', 'Date', 'Time', 'Items', 'Payment Method', 'Total', 'Subtotal', 'Discount'];
    const csvData = filteredSales.map(sale => [
      sale.receiptNumber || '',
      new Date(sale.createdAt).toLocaleDateString(),
      new Date(sale.createdAt).toLocaleTimeString(),
      sale.items?.length || 0,
      sale.paymentMethod || '',
      sale.total || 0,
      sale.subtotal || 0,
      sale.discount?.amount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Sales Analytics</h1>
        <p className="text-gray-600">Track and analyze your sales performance</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
              <button 
                onClick={loadSales}
                className="mt-2 text-red-700 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-6 py-3 rounded-lg font-bold transition ${
                viewMode === 'day' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              📅 Today
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-6 py-3 rounded-lg font-bold transition ${
                viewMode === 'week' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              📆 This Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-6 py-3 rounded-lg font-bold transition ${
                viewMode === 'month' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              📊 This Month
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={`px-6 py-3 rounded-lg font-bold transition ${
                viewMode === 'custom' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              🔍 Custom Range
            </button>
          </div>

          {viewMode === 'custom' && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  max={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <span className="font-bold mt-6">to</span>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  min={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg flex items-center gap-2"
            >
              📥 Export CSV
            </button>
            <button
              onClick={printReport}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold shadow-lg flex items-center gap-2"
            >
              🖨️ Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Sales</h3>
                <span className="text-3xl">🛒</span>
              </div>
              <p className="text-4xl font-bold">{filteredSales.length}</p>
              <p className="text-sm opacity-75 mt-2">Transactions completed</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
                <span className="text-3xl">💰</span>
              </div>
              <p className="text-4xl font-bold">Rs. {totalRevenue.toFixed(2)}</p>
              <p className="text-sm opacity-75 mt-2">Gross income</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Average Sale</h3>
                <span className="text-3xl">📈</span>
              </div>
              <p className="text-4xl font-bold">Rs. {averageSale.toFixed(2)}</p>
              <p className="text-sm opacity-75 mt-2">Per transaction</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Items Sold</h3>
                <span className="text-3xl">📦</span>
              </div>
              <p className="text-4xl font-bold">{totalItems}</p>
              <p className="text-sm opacity-75 mt-2">Total quantity</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Payment Methods Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-3xl">💳</span>
                  Payment Methods
                </h2>
              </div>
              {paymentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: Rs. ${value.toFixed(0)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`Rs. ${value.toFixed(2)}`, 'Amount']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-xl font-bold">No payment data</p>
                    <p>Complete a sale to see payment statistics</p>
                  </div>
                </div>
              )}
            </div>

            {/* Daily Sales Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-3xl">📊</span>
                  Sales Trend
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      chartType === 'bar' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      chartType === 'line' 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>
              {dailySalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'bar' ? (
                    <BarChart data={dailySalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`Rs. ${value.toFixed(2)}`, 'Revenue']} />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        fill="#3B82F6" 
                        name="Revenue (Rs.)" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={dailySalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`Rs. ${value.toFixed(2)}`, 'Revenue']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3B82F6" 
                        strokeWidth={3} 
                        name="Revenue (Rs.)" 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-xl font-bold">No sales data</p>
                    <p>Complete sales to see trends</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-3xl">🏆</span>
                Top 5 Products
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {topProducts.map((product, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-blue-500'
                      }`}>
                        #{index + 1}
                      </div>
                      <span className="text-2xl">📦</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 truncate" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-bold">{product.quantity} units</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-bold text-green-600">Rs. {product.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">📋</span>
                Transaction History
              </h2>
              <div className="text-sm text-gray-600">
                Showing {filteredSales.length} of {sales.length} total transactions
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Receipt #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-xl font-bold">No sales found</p>
                        <p>Try adjusting your filters or complete a sale</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => (
                      <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-blue-600">{sale.receiptNumber || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{new Date(sale.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold inline-flex items-center gap-1">
                            <span>🛒</span>
                            {sale.items?.length || 0} items
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize inline-flex items-center gap-1 ${
                            sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                            sale.paymentMethod === 'card' ? 'bg-purple-100 text-purple-800' :
                            sale.paymentMethod === 'upi' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sale.paymentMethod === 'cash' ? '💵' :
                             sale.paymentMethod === 'card' ? '💳' :
                             sale.paymentMethod === 'upi' ? '📱' : '💰'}
                            {sale.paymentMethod || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-lg text-green-600">
                            Rs. {(sale.total || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => viewDetails(sale)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm transition-colors flex items-center gap-2"
                          >
                            👁️ View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Sale Details Modal */}
      {selectedSale && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setSelectedSale(null)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-4xl">🧾</span>
                Sale Details
              </h2>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-500 hover:text-gray-700 text-4xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Receipt Header */}
            <div className="mb-8 text-center border-b pb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">NIPI 9M Fashion</h1>
              <p className="text-gray-600">Sales Receipt</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-5">
                <p className="text-sm text-gray-600 font-medium mb-2">Receipt Number</p>
                <p className="text-xl font-bold text-blue-600">{selectedSale.receiptNumber || 'N/A'}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-5">
                <p className="text-sm text-gray-600 font-medium mb-2">Date & Time</p>
                <p className="text-lg font-bold">{new Date(selectedSale.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🛍️</span>
                Items Purchased
              </h3>
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-700">Product</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-700">Qty</th>
                      <th className="px-6 py-4 text-right font-bold text-gray-700">Price</th>
                      <th className="px-6 py-4 text-right font-bold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items?.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-white">
                        <td className="px-6 py-4 font-medium">{item.name || 'Unknown Item'}</td>
                        <td className="px-6 py-4 text-center font-bold">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            {item.quantity || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">Rs. {(item.price || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                          Rs. {(item.total || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 space-y-4 border border-green-200">
              <div className="flex justify-between text-lg">
                <span className="font-medium text-gray-700">Subtotal:</span>
                <span className="font-bold">Rs. {(selectedSale.subtotal || 0).toFixed(2)}</span>
              </div>
              
              {selectedSale.discount && (selectedSale.discount.amount || selectedSale.discount.name) && (
                <div className="flex justify-between text-lg text-green-600">
                  <span className="font-medium">
                    Discount {selectedSale.discount.name ? `(${selectedSale.discount.name})` : ''}:
                  </span>
                  <span className="font-bold">- Rs. {(selectedSale.discount.amount || 0).toFixed(2)}</span>
                </div>
              )}

              <div className="border-t-2 border-gray-300 pt-4 flex justify-between font-bold text-2xl text-blue-600">
                <span>TOTAL AMOUNT:</span>
                <span>Rs. {(selectedSale.total || 0).toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-300 pt-4 space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-700">Payment Method:</span>
                  <span className="font-bold capitalize inline-flex items-center gap-2">
                    {selectedSale.paymentMethod === 'cash' ? '💵' :
                     selectedSale.paymentMethod === 'card' ? '💳' :
                     selectedSale.paymentMethod === 'upi' ? '📱' : '💰'}
                    {selectedSale.paymentMethod || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-700">Amount Paid:</span>
                  <span className="font-bold">Rs. {(selectedSale.amountPaid || 0).toFixed(2)}</span>
                </div>
                
                {selectedSale.change > 0 && (
                  <div className="flex justify-between text-xl font-bold text-green-600">
                    <span>Change Given:</span>
                    <span>Rs. {(selectedSale.change || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-600">
              <p>Thank you for shopping with NIPI 9M Fashion!</p>
              <p className="text-sm mt-2">For any inquiries, please contact store management</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;