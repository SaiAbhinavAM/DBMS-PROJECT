import React, { useState } from 'react';
import { productAPI } from '../services/api';
import '../styles/Forms.css';

const AddProductForm = ({ growerID, onProductAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    pricePerUnit: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.category || !formData.pricePerUnit) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      await productAPI.addProduct(
        formData.name,
        formData.category,
        parseFloat(formData.pricePerUnit),
        growerID
      );
      
      setSuccess('Product added successfully!');
      setFormData({ name: '', category: '', pricePerUnit: '' });
      
      setTimeout(() => {
        onProductAdded();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Vegetables', 'Leafy Greens', 'Root Vegetables', 'Fruits', 'Herbs', 'Other'];

  return (
    <div className="form-container">
      <h3>Add New Product</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Organic Tomatoes"
            required
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Price Per Unit (₹)</label>
          <input
            type="number"
            name="pricePerUnit"
            value={formData.pricePerUnit}
            onChange={handleChange}
            placeholder="e.g., 50"
            step="0.01"
            min="0"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;