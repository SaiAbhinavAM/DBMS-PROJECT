import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { growerAPI, recommendationAPI, analyticsAPI } from '../services/api';
import AddProductForm from '../components/AddProductForm';
import AddRecommendationForm from '../components/AddRecommendationForm';
import '../styles/Dashboard.css';

const GrowerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [growerDetails, setGrowerDetails] = useState(null);
  const [plots, setPlots] = useState([]);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGrowerData();
  }, [user?.id]);

  const fetchGrowerData = async () => {
    try {
      setLoading(true);
      const [detailsRes, plotsRes, productsRes, recommendationsRes] = await Promise.all([
        growerAPI.getDetails(user.id),
        growerAPI.getPlots(user.id),
        growerAPI.getProducts(user.id),
        recommendationAPI.getRecommendations()
      ]);

      setGrowerDetails(detailsRes.data);
      setPlots(plotsRes.data);
      setProducts(productsRes.data);
      setRecommendations(recommendationsRes.data);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductAdded = () => {
    fetchGrowerData();
    setActiveTab('products');
  };

  const handleRecommendationAdded = () => {
    fetchGrowerData();
    setActiveTab('recommendations');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-content">
          <h2>🌱 Grower Dashboard</h2>
          <div className="nav-user">
            <span>Welcome, {user?.Name}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="sidebar">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button
            className={`tab-btn ${activeTab === 'add-product' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-product')}
          >
            ➕ Add Product
          </button>
          <button
            className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            💡 Recommendations
          </button>
          <button
            className={`tab-btn ${activeTab === 'add-recommendation' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-recommendation')}
          >
            ➕ Add Recommendation
          </button>
        </div>

        <div className="content">
          {error && <div className="error-message">{error}</div>}

          {activeTab === 'overview' && (
            <div className="tab-content">
              <h3>Grower Information</h3>
              {loading ? (
                <p>Loading...</p>
              ) : growerDetails ? (
                <div className="info-card">
                  <div className="info-row">
                    <label>Name:</label>
                    <span>{growerDetails.Name}</span>
                  </div>
                  <div className="info-row">
                    <label>Contact:</label>
                    <span>{growerDetails.ContactNo}</span>
                  </div>
                  <div className="info-row">
                    <label>Address:</label>
                    <span>{growerDetails.Address}</span>
                  </div>
                  <div className="info-row">
                    <label>Member Since:</label>
                    <span>{new Date(growerDetails.CreatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : null}

              <h3>Your Plots</h3>
              {plots.length > 0 ? (
                <div className="plots-grid">
                  {plots.map(plot => (
                    <div key={plot.PlotID} className="plot-card">
                      <h4>{plot.Location}</h4>
                      <p><strong>Size:</strong> {plot.Size} sq.m</p>
                      <p><strong>Soil Type:</strong> {plot.SoilType}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No plots found</p>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="tab-content">
              <h3>Your Products</h3>
              {products.length > 0 ? (
                <div className="products-grid">
                  {products.map(product => (
                    <div key={product.ProductID} className="product-card">
                      <h4>{product.Name}</h4>
                      <p><strong>Category:</strong> {product.Category}</p>
                      <p><strong>Price:</strong> ₹{product.PricePerUnit}/unit</p>
                      <p className="date">Created: {new Date(product.CreatedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No products added yet</p>
              )}
            </div>
          )}

          {activeTab === 'add-product' && (
            <div className="tab-content">
              <AddProductForm growerID={user.id} onProductAdded={handleProductAdded} />
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="tab-content">
              <h3>All Recommendations</h3>
              {loading ? (
                <p>Loading...</p>
              ) : recommendations.length > 0 ? (
                <div className="recommendations-grid">
                  {recommendations.map(rec => (
                    <div key={rec.RecommendationID} className="recommendation-card">
                      <h4>{rec.RecommendedCrop}</h4>
                      <p><strong>Town:</strong> {rec.TownName}</p>
                      <p><strong>Season:</strong> {rec.Season}</p>
                      <p><strong>Climate:</strong> {rec.ClimateType}</p>
                      <p><strong>Soil Type:</strong> {rec.SoilType}</p>
                      <p><strong>Expected Yield:</strong> {rec.ExpectedYield} tons</p>
                      <p><strong>Benefits:</strong> {rec.Benefits}</p>
                      <p><strong>Practices:</strong> {rec.RecommendedPractices}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No recommendations available</p>
              )}
            </div>
          )}

          {activeTab === 'add-recommendation' && (
            <div className="tab-content">
              <AddRecommendationForm growerID={user.id} onRecommendationAdded={handleRecommendationAdded} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrowerDashboard;