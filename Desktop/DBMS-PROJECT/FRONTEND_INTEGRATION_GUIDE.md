# Frontend Integration Guide - Database Objects

This guide shows how to integrate the new database objects into your React frontend.

---

## 📋 Table of Contents

1. [Creating a Service Module](#creating-a-service-module)
2. [Integration Examples](#integration-examples)
3. [UI Components](#ui-components)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)

---

## Creating a Service Module

### Create `/frontend/src/services/databaseObjectsService.js`

```javascript
/**
 * Service for Database Objects APIs
 * Handles all calls to advanced features (procedures, functions, queries)
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5011/api';

// Helper function to get token from localStorage
const getToken = () => localStorage.getItem('token');

// Create axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =====================================================
// 1. Process Complete Order (Stored Procedure)
// =====================================================
export const processCompleteOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/orders/process-complete', orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Error processing order' };
  }
};

// =====================================================
// 2. Get Grower Revenue (Function)
// =====================================================
export const getGrowerRevenue = async (growerId, startDate, endDate) => {
  try {
    const response = await apiClient.get(`/growers/${growerId}/revenue`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Error fetching revenue' };
  }
};

// =====================================================
// 3. Get Grower Performance Dashboard (Complex Query)
// =====================================================
export const getGrowerPerformanceDashboard = async () => {
  try {
    const response = await apiClient.get('/growers/dashboard/performance');
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Error fetching dashboard' };
  }
};

// =====================================================
// 4. Get Single Grower Performance
// =====================================================
export const getGrowerPerformance = async (growerId) => {
  try {
    const response = await apiClient.get(`/growers/${growerId}/performance`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Error fetching performance' };
  }
};

// =====================================================
// 5. Test Triggers
// =====================================================
export const testTriggers = async () => {
  try {
    const response = await apiClient.post('/database/test-triggers', {});
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Error testing triggers' };
  }
};

export default {
  processCompleteOrder,
  getGrowerRevenue,
  getGrowerPerformanceDashboard,
  getGrowerPerformance,
  testTriggers,
};
```

---

## Integration Examples

### Example 1: Order Processing Component

```jsx
// /frontend/src/components/OrderProcessing.jsx
import React, { useState } from 'react';
import { processCompleteOrder } from '../services/databaseObjectsService';

const OrderProcessing = () => {
  const [formData, setFormData] = useState({
    customerID: '',
    orderDate: new Date().toISOString().split('T')[0],
    paymentMode: 'card',
    productID: '',
    quantity: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Convert string values to numbers
      const data = {
        customerID: parseInt(formData.customerID),
        orderDate: formData.orderDate,
        paymentMode: formData.paymentMode,
        productID: parseInt(formData.productID),
        quantity: parseFloat(formData.quantity),
      };

      const result = await processCompleteOrder(data);

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        setOrderResult(result);
        setFormData({
          customerID: '',
          orderDate: new Date().toISOString().split('T')[0],
          paymentMode: 'card',
          productID: '',
          quantity: '',
        });
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-processing">
      <h2>Process Complete Order</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Customer ID:</label>
          <input
            type="number"
            name="customerID"
            value={formData.customerID}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Order Date:</label>
          <input
            type="date"
            name="orderDate"
            value={formData.orderDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Payment Mode:</label>
          <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="form-group">
          <label>Product ID:</label>
          <input
            type="number"
            name="productID"
            value={formData.productID}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Quantity:</label>
          <input
            type="number"
            step="0.01"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Process Order'}
        </button>
      </form>

      {message && <div className="alert">{message}</div>}

      {orderResult && (
        <div className="result">
          <h3>Order Created Successfully!</h3>
          <p>Order ID: {orderResult.orderID}</p>
          <p>Message: {orderResult.message}</p>
        </div>
      )}
    </div>
  );
};

export default OrderProcessing;
```

### Example 2: Grower Revenue Component

```jsx
// /frontend/src/components/GrowerRevenue.jsx
import React, { useState } from 'react';
import { getGrowerRevenue } from '../services/databaseObjectsService';

const GrowerRevenue = () => {
  const [growerId, setGrowerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchRevenue = async () => {
    if (!growerId || !startDate || !endDate) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getGrowerRevenue(growerId, startDate, endDate);
      if (result.success) {
        setRevenue(result);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grower-revenue">
      <h2>Calculate Grower Revenue</h2>

      <div className="form-group">
        <label>Grower ID:</label>
        <input
          type="number"
          value={growerId}
          onChange={(e) => setGrowerId(e.target.value)}
          placeholder="Enter grower ID"
        />
      </div>

      <div className="form-group">
        <label>Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <button onClick={handleFetchRevenue} disabled={loading}>
        {loading ? 'Loading...' : 'Calculate Revenue'}
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      {revenue && (
        <div className="revenue-result">
          <h3>Revenue Report</h3>
          <p>Grower ID: {revenue.growerID}</p>
          <p>Period: {revenue.startDate} to {revenue.endDate}</p>
          <p className="revenue-amount">
            Total Revenue: <strong>₹{revenue.totalRevenue.toFixed(2)}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default GrowerRevenue;
```

### Example 3: Grower Performance Dashboard

```jsx
// /frontend/src/components/GrowerPerformanceDashboard.jsx
import React, { useEffect, useState } from 'react';
import { getGrowerPerformanceDashboard } from '../services/databaseObjectsService';

const GrowerPerformanceDashboard = () => {
  const [growers, setGrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getGrowerPerformanceDashboard();
      if (result.success) {
        setGrowers(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="performance-dashboard">
      <h2>Grower Performance Dashboard</h2>
      <button onClick={fetchDashboard}>Refresh Data</button>

      <div className="growers-grid">
        {growers.map((grower) => (
          <div key={grower.GrowerID} className="grower-card">
            <h3>{grower.GrowerName}</h3>

            <div className="metrics">
              <div className="metric">
                <span className="label">Revenue:</span>
                <span className="value">₹{grower.TotalRevenue?.toFixed(2)}</span>
              </div>

              <div className="metric">
                <span className="label">Orders:</span>
                <span className="value">{grower.TotalOrders}</span>
              </div>

              <div className="metric">
                <span className="label">Avg Order Value:</span>
                <span className="value">₹{grower.AverageOrderValue?.toFixed(2)}</span>
              </div>

              <div className="metric">
                <span className="label">Success Rate:</span>
                <span className="value">{grower.DeliverySuccessRate}%</span>
              </div>

              <div className="metric">
                <span className="label">Products:</span>
                <span className="value">{grower.TotalProducts}</span>
              </div>

              <div className="metric">
                <span className="label">Plots:</span>
                <span className="value">{grower.TotalPlots}</span>
              </div>

              <div className="metric">
                <span className="label">Available Stock:</span>
                <span className="value">{grower.TotalAvailableQuantity}</span>
              </div>

              <div className="metric">
                <span className="label">Satisfied Customers:</span>
                <span className="value">{grower.SatisfiedCustomers}</span>
              </div>
            </div>

            <div className="details">
              <p><strong>Contact:</strong> {grower.ContactNo}</p>
              <p><strong>Soil Types:</strong> {grower.SoilTypes}</p>
              <p><strong>Last Order:</strong> {grower.LastOrderDate}</p>
              <p><strong>Categories:</strong> {grower.ProductCategories}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrowerPerformanceDashboard;
```

---

## UI Components

### CSS Styling Example

```css
/* Add to your main CSS file */

.order-processing,
.grower-revenue,
.performance-dashboard {
  padding: 20px;
  margin: 20px 0;
  background: #f9f9f9;
  border-radius: 8px;
}

.form-group {
  margin: 15px 0;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 5px;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.alert {
  padding: 15px;
  margin: 15px 0;
  border-radius: 4px;
  border-left: 4px solid #2196F3;
  background-color: #e3f2fd;
}

.alert-error {
  border-left-color: #f44336;
  background-color: #ffebee;
}

.result,
.revenue-result {
  padding: 15px;
  margin: 15px 0;
  background-color: #e8f5e9;
  border-radius: 4px;
  border-left: 4px solid #4CAF50;
}

.revenue-amount {
  font-size: 24px;
  color: #2e7d32;
  font-weight: bold;
}

.growers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.grower-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.grower-card h3 {
  margin-top: 0;
  color: #333;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 15px 0;
}

.metric {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.metric .label {
  font-weight: 600;
  color: #666;
}

.metric .value {
  color: #2e7d32;
  font-weight: bold;
}

.details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  font-size: 14px;
}

.details p {
  margin: 8px 0;
}
```

---

## Error Handling

```javascript
// Common error scenarios and how to handle them

// 1. Authentication Error
try {
  const result = await processCompleteOrder(data);
} catch (error) {
  if (error.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

// 2. Validation Error
try {
  const result = await getGrowerRevenue(id, start, end);
} catch (error) {
  if (error.message.includes('required')) {
    console.log('Missing required fields');
  }
}

// 3. Server Error
try {
  const result = await getGrowerPerformanceDashboard();
} catch (error) {
  console.error('Server error:', error);
  // Show user-friendly message
  alert('Unable to load dashboard. Please try again later.');
}

// 4. Network Error
try {
  const result = await processCompleteOrder(data);
} catch (error) {
  if (!error.response) {
    console.log('Network error - server is unreachable');
  }
}
```

---

## Best Practices

### 1. **Always Use Loading States**
```javascript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    // API call
  } finally {
    setLoading(false);
  }
};
```

### 2. **Validate User Input**
```javascript
const validateOrderData = (data) => {
  if (!data.customerID || data.customerID <= 0) {
    throw new Error('Invalid customer ID');
  }
  if (!data.productID || data.productID <= 0) {
    throw new Error('Invalid product ID');
  }
  if (!data.quantity || data.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
};
```

### 3. **Handle API Errors Gracefully**
```javascript
try {
  const result = await processCompleteOrder(data);
  if (!result.success) {
    setError(result.message); // From server
    return;
  }
} catch (error) {
  setError(error.message || 'An unexpected error occurred');
}
```

### 4. **Use Context for Global State**
```javascript
// Create context for current user, token, etc.
const UserContext = React.createContext();

// Use in components
const { user, token } = useContext(UserContext);
```

### 5. **Debounce API Calls**
```javascript
import { useCallback } from 'react';

const fetchData = useCallback(
  debounce(async (query) => {
    // API call
  }, 500),
  []
);
```

---

## Integration Checklist

- [ ] Created `databaseObjectsService.js`
- [ ] Created order processing component
- [ ] Created revenue report component
- [ ] Created performance dashboard component
- [ ] Added CSS styling
- [ ] Implemented error handling
- [ ] Tested all components
- [ ] Added loading states
- [ ] Validated user inputs
- [ ] Added to navigation menu

---

## Testing in Development

1. Start backend: `npm start` in `/backend`
2. Start frontend: `npm start` in `/frontend`
3. Login with test credentials:
   - Email: `john@farmmail.com`
   - Password: `john123`
4. Test each component with sample data
5. Check browser console for errors

---

## Sample Test Data

```javascript
// Order Processing
{
  customerID: 1,
  orderDate: "2024-01-15",
  paymentMode: "card",
  productID: 1,
  quantity: 10.0
}

// Revenue Report
growerId: 1
startDate: "2024-01-01"
endDate: "2024-12-31"
```

---

For detailed API documentation, see `API_REFERENCE.md`