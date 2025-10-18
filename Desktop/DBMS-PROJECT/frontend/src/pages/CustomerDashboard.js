import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productAPI, orderAPI } from '../services/api';
import ProductList from '../components/ProductList';
import Cart from '../components/Cart';
import OrderHistory from '../components/OrderHistory';
import '../styles/Dashboard.css';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        productAPI.getAll(),
        orderAPI.getCustomerOrders(user.id)
      ]);

      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.ProductID === product.ProductID);
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.ProductID === product.ProductID
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } else {
      const newCart = [...cart, { ...product, quantity: 1 }];
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  const removeFromCart = (productID) => {
    const updatedCart = cart.filter(item => item.ProductID !== productID);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const updateCartQuantity = (productID, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productID);
    } else {
      const updatedCart = cart.map(item =>
        item.ProductID === productID
          ? { ...item, quantity }
          : item
      );
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    }
  };

  const handleCheckout = () => {
    fetchData(); // Refresh orders
    setCart([]);
    localStorage.removeItem('cart');
    setActiveTab('orders');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-content">
          <h2>🛒 Customer Dashboard</h2>
          <div className="nav-user">
            <span>Welcome, {user?.name}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="sidebar">
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button
            className={`tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            🛒 Cart ({cart.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Orders
          </button>
        </div>

        <div className="content">
          {error && <div className="error-message">{error}</div>}

          {activeTab === 'products' && (
            <div className="tab-content">
              <h3>Available Products</h3>
              {loading ? (
                <p>Loading products...</p>
              ) : (
                <ProductList 
                  products={products} 
                  onAddToCart={addToCart}
                />
              )}
            </div>
          )}

          {activeTab === 'cart' && (
            <div className="tab-content">
              <Cart 
                cart={cart}
                onRemove={removeFromCart}
                onUpdateQuantity={updateCartQuantity}
                onCheckout={handleCheckout}
                customerID={user.id}
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="tab-content">
              <h3>Order History</h3>
              {loading ? (
                <p>Loading orders...</p>
              ) : (
                <OrderHistory orders={orders} customerID={user.id} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;