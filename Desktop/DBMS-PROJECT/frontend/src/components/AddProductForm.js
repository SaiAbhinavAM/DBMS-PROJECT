import React, { useState } from 'react';
import { productAPI } from '../services/api';
import '../styles/Forms.css';

const AddProductForm = ({ growerID, onProductAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    pricePerUnit: '',
    batchNo: '',
    harvestDate: '',
    expiryDate: '',
    quantityAvailable: ''
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

    if (
      !formData.name ||
      !formData.category ||
      !formData.pricePerUnit ||
      !formData.quantityAvailable ||
      !formData.batchNo ||
      !formData.harvestDate ||
      !formData.expiryDate
    ) {
      setError('All fields are required. Please complete the form.');
      return;
    }

    const price = parseFloat(formData.pricePerUnit);
    const quantity = parseFloat(formData.quantityAvailable);

    if (Number.isNaN(price) || price <= 0) {
      setError('Price per unit must be a positive number.');
      return;
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    if (new Date(formData.harvestDate) > new Date(formData.expiryDate)) {
      setError('Expiry date must be after the harvest date.');
      return;
    }

    setLoading(true);

    try {
      const productResponse = await productAPI.addProduct(
        formData.name,
        formData.category,
        price,
        growerID
      );

      const product = productResponse.data;

      await productAPI.addHarvestBatch(
        product.ProductID,
        formData.batchNo,
        formData.harvestDate,
        formData.expiryDate,
        quantity
      );
      
      setSuccess('Product and inventory added successfully!');
      setFormData({
        name: '',
        category: '',
        pricePerUnit: '',
        batchNo: '',
        harvestDate: '',
        expiryDate: '',
        quantityAvailable: ''
      });
      
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

        <div className="form-group">
          <label>Quantity Available</label>
          <input
            type="number"
            name="quantityAvailable"
            value={formData.quantityAvailable}
            onChange={handleChange}
            placeholder="e.g., 100"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Batch Number (optional)</label>
          <input
            type="text"
            name="batchNo"
            value={formData.batchNo}
            onChange={handleChange}
            placeholder="Leave blank to auto-generate"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Harvest Date (optional)</label>
            <input
              type="date"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Expiry Date (optional)</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProductForm;