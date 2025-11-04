import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, analyticsAPI } from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('growers');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueData, setRevenueData] = useState({});
  const [calculatingRevenue, setCalculatingRevenue] = useState(false);

  const tabs = [
    { key: 'growers', label: '🌱 Growers', count: 0 },
    { key: 'products', label: '📦 Products', count: 0 },
    { key: 'orders', label: '📋 Orders', count: 0 },
    { key: 'customers', label: '👥 Customers', count: 0 },
    { key: 'payments', label: '💳 Payments', count: 0 },
    { key: 'recommendations', label: '💡 Recommendations', count: 0 },
    { key: 'harvestBatches', label: '🌾 Harvest Batches', count: 0 },
    { key: 'revenue', label: '📊 Revenue Report', count: 0 }
  ];

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    setError('');
    try {
      let response;
      switch (tab) {
        case 'growers':
          response = await adminAPI.getAllGrowers();
          break;
        case 'products':
          response = await adminAPI.getAllProducts();
          break;
        case 'orders':
          response = await adminAPI.getAllOrders();
          break;
        case 'customers':
          response = await adminAPI.getAllCustomers();
          break;
        case 'payments':
          response = await adminAPI.getAllPayments();
          break;
        case 'recommendations':
          response = await adminAPI.getAllRecommendations();
          break;
        case 'harvestBatches':
          response = await adminAPI.getAllHarvestBatches();
          break;
        case 'revenue':
          response = await adminAPI.getAllGrowers(); // Use growers data for revenue tab
          break;
        default:
          response = { data: [] };
      }
      setData(response.data);
      // Reset revenue data when switching tabs
      if (tab === 'revenue') {
        setStartDate('');
        setEndDate('');
        setRevenueData({});
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item[Object.keys(item)[0]]);
    setEditData(JSON.parse(JSON.stringify(item)));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let response;
      const id = editingId;
      
      switch (activeTab) {
        case 'growers':
          response = await adminAPI.updateGrower(id, {
            name: editData.Name,
            contactNo: editData.ContactNo,
            address: editData.Address
          });
          break;
        case 'products':
          response = await adminAPI.updateProduct(id, {
            name: editData.Name,
            category: editData.Category,
            pricePerUnit: editData.PricePerUnit
          });
          break;
        case 'orders':
          response = await adminAPI.updateOrder(id, {
            status: editData.Status
          });
          break;
        case 'customers':
          response = await adminAPI.updateCustomer(id, {
            name: editData.Name,
            email: editData.Email,
            contactNo: editData.ContactNo,
            address: editData.Address
          });
          break;
        default:
          return;
      }
      
      setSuccess('Updated successfully!');
      setEditingId(null);
      fetchData(activeTab);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = async (growerId) => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    setCalculatingRevenue(true);
    setError('');

    try {
      const response = await analyticsAPI.getGrowerRevenue(growerId, startDate, endDate);
      // Ensure we're storing a number value
      const revenue = parseFloat(response.data?.totalRevenue || 0);
      setRevenueData(prev => ({
        ...prev,
        [growerId]: revenue
      }));
      setSuccess(`Revenue calculated successfully for Grower #${growerId}`);
    } catch (err) {
      setError(`Failed to calculate revenue for Grower #${growerId}: ${err.message}`);
      // Set revenue to 0 on error
      setRevenueData(prev => ({
        ...prev,
        [growerId]: 0
      }));
    } finally {
      setCalculatingRevenue(false);
    }
  };

  const renderRevenueTable = () => {
    return (
      <div className="revenue-section">
        <div className="date-picker-container">
          <div className="date-picker">
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-picker">
            <label>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Grower ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((grower) => (
                <tr key={grower.GrowerID}>
                  <td>{grower.GrowerID}</td>
                  <td>{grower.Name}</td>
                  <td>{grower.ContactNo}</td>
                  <td>
                    {revenueData[grower.GrowerID] !== undefined
                      ? `₹${revenueData[grower.GrowerID].toFixed(2)}`
                      : '---'}
                  </td>
                  <td className="action-cell">
                    <button
                      className="btn-calculate"
                      onClick={() => calculateRevenue(grower.GrowerID)}
                      disabled={calculatingRevenue || !startDate || !endDate}
                    >
                      {calculatingRevenue ? 'Calculating...' : 'Calculate Revenue'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (data.length === 0) return <div className="no-data">No data available</div>;

    if (activeTab === 'revenue') {
      return renderRevenueTable();
    }

    const columns = Object.keys(data[0] || {});

    return (
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className={editingId === item[columns[0]] ? 'editing' : ''}>
                {columns.map((col) => (
                  <td key={col}>
                    {editingId === item[columns[0]] ? (
                      <input
                        type={col.includes('Price') || col.includes('Quantity') ? 'number' : 'text'}
                        value={editData[col] || ''}
                        onChange={(e) =>
                          setEditData({ ...editData, [col]: e.target.value })
                        }
                        className="edit-input"
                      />
                    ) : (
                      <span>{String(item[col]).substring(0, 50)}</span>
                    )}
                  </td>
                ))}
                <td className="action-cell">
                  {editingId === item[columns[0]] ? (
                    <>
                      <button
                        className="btn-save"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>👨‍💼 Admin Dashboard</h1>
        <div className="header-actions">
          <button
            className="complex-queries-btn"
            onClick={() => navigate('/admin/complex-queries')}
          >
            🔍 Complex Queries
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content-area">
        <div className="section-header">
          <h2>{tabs.find(t => t.key === activeTab)?.label}</h2>
          <span className="record-count">
            {data.length} Record{data.length !== 1 ? 's' : ''}
          </span>
        </div>
        {renderTable()}
      </div>
    </div>
  );
};

export default AdminDashboard;