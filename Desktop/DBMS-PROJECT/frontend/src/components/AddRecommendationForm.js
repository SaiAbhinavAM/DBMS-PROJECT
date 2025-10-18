import React, { useState } from 'react';
import { recommendationAPI } from '../services/api';
import '../styles/Forms.css';

const AddRecommendationForm = ({ growerID, onRecommendationAdded }) => {
  const [formData, setFormData] = useState({
    townName: '',
    climateType: '',
    season: '',
    recommendedCrop: '',
    benefits: '',
    expectedYield: '',
    soilType: '',
    recommendedPractices: ''
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

    // Validation
    const requiredFields = ['townName', 'climateType', 'season', 'recommendedCrop', 'soilType'];
    if (requiredFields.some(field => !formData[field])) {
      setError('All required fields must be filled');
      return;
    }

    setLoading(true);

    try {
      await recommendationAPI.addRecommendation({
        townName: formData.townName,
        climateType: formData.climateType,
        season: formData.season,
        recommendedCrop: formData.recommendedCrop,
        benefits: formData.benefits,
        expectedYield: formData.expectedYield ? parseFloat(formData.expectedYield) : null,
        soilType: formData.soilType,
        recommendedPractices: formData.recommendedPractices,
        growerID
      });

      setSuccess('Recommendation added successfully!');
      setFormData({
        townName: '',
        climateType: '',
        season: '',
        recommendedCrop: '',
        benefits: '',
        expectedYield: '',
        soilType: '',
        recommendedPractices: ''
      });

      setTimeout(() => {
        onRecommendationAdded();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add recommendation');
    } finally {
      setLoading(false);
    }
  };

  const climateTypes = ['Tropical', 'Mediterranean', 'Temperate', 'Continental', 'Arid'];
  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const soilTypes = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty'];

  return (
    <div className="form-container">
      <h3>Add Recommendation</h3>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Town Name *</label>
            <input
              type="text"
              name="townName"
              value={formData.townName}
              onChange={handleChange}
              placeholder="e.g., Green Valley"
              required
            />
          </div>

          <div className="form-group">
            <label>Climate Type *</label>
            <select
              name="climateType"
              value={formData.climateType}
              onChange={handleChange}
              required
            >
              <option value="">Select climate</option>
              {climateTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Season *</label>
            <select
              name="season"
              value={formData.season}
              onChange={handleChange}
              required
            >
              <option value="">Select season</option>
              {seasons.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Soil Type *</label>
            <select
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              required
            >
              <option value="">Select soil type</option>
              {soilTypes.map(soil => (
                <option key={soil} value={soil}>{soil}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Recommended Crop *</label>
          <input
            type="text"
            name="recommendedCrop"
            value={formData.recommendedCrop}
            onChange={handleChange}
            placeholder="e.g., Tomatoes"
            required
          />
        </div>

        <div className="form-group">
          <label>Benefits</label>
          <textarea
            name="benefits"
            value={formData.benefits}
            onChange={handleChange}
            placeholder="Describe the benefits of this crop"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Expected Yield (tons/acre)</label>
          <input
            type="number"
            name="expectedYield"
            value={formData.expectedYield}
            onChange={handleChange}
            placeholder="e.g., 8.5"
            step="0.1"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Recommended Practices</label>
          <textarea
            name="recommendedPractices"
            value={formData.recommendedPractices}
            onChange={handleChange}
            placeholder="Describe the recommended farming practices"
            rows="3"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding Recommendation...' : 'Add Recommendation'}
        </button>
      </form>
    </div>
  );
};

export default AddRecommendationForm;