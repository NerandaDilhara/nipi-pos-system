import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import POS from './pages/POS';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Discounts from './pages/Discounts';
import Sales from './pages/Sales';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold">NIPI 9M Fashion POS</h1>
              <div className="flex space-x-4">
                <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">POS</Link>
                <Link to="/products" className="hover:bg-blue-700 px-3 py-2 rounded">Products</Link>
                <Link to="/suppliers" className="hover:bg-blue-700 px-3 py-2 rounded">Suppliers</Link>
                <Link to="/discounts" className="hover:bg-blue-700 px-3 py-2 rounded">Discounts</Link>
                <Link to="/sales" className="hover:bg-blue-700 px-3 py-2 rounded">Sales</Link>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/sales" element={<Sales />} />
          </Routes>
        </div>

        <footer>
          <div className="bg-blue-600 text-white text-center py-4 mt-8">
            &copy; {new Date().getFullYear()} NIPI 9M Fashion. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;