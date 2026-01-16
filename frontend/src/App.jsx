import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FaHome, FaTags, FaBox, FaTruck, FaReceipt } from 'react-icons/fa'; // Importing icons
import POS from './pages/POS';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Discounts from './pages/Discounts';
import Sales from './pages/Sales';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        {/* Navbar */}
        <nav className="bg-blue-300 text-black shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold tracking-wide">NIPI 9M Fashion POS</h1>
              <div className="hidden md:flex space-x-6">
                <Link to="/" className="flex items-center hover:bg-blue-400 px-5 py-2 rounded transition-all">
                  <FaHome className="mr-2" /> POS
                </Link>
                <Link to="/products" className="flex items-center hover:bg-blue-400 px-5 py-2 rounded transition-all">
                  <FaBox className="mr-2" /> Products
                </Link>
                <Link to="/suppliers" className="flex items-center hover:bg-blue-400 px-5 py-2 rounded transition-all">
                  <FaTruck className="mr-2" /> Suppliers
                </Link>
                <Link to="/discounts" className="flex items-center hover:bg-blue-400 px-5 py-2 rounded transition-all">
                  <FaTags className="mr-2" /> Discounts
                </Link>
                <Link to="/sales" className="flex items-center hover:bg-blue-400 px-5 py-2 rounded transition-all">
                  <FaReceipt className="mr-2" /> Sales
                </Link>
              </div>
              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center">
                <button className="text-white p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Routes */}
        <div className="container mx-auto px-4 py-8 flex-grow">
          <Routes>
            <Route path="/" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/sales" element={<Sales />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-blue-300 text-black font-bold py-6 mt-8">
          <div className="container mx-auto text-center space-y-4">
            <p>&copy; {new Date().getFullYear()} NIPI 9M Fashion. All rights reserved.</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="hover:text-blue-700 transition-all">Facebook</a>
              <a href="#" className="hover:text-blue-700 transition-all">YouTube</a>
              <a href="#" className="hover:text-blue-700 transition-all">TikTok</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
