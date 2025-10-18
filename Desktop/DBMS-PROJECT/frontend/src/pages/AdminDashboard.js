import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
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

  const tabs = [
    { key: 'growers', label: '🌱 Growers', count: 0 },
    { key: 'products', label: '📦 Products', count: 0 },
    { key: 'orders', label: '📋 Orders', count: 0 },
    { key: 'customers', label: '👥 Customers', count: 0 },
    { key: 'payments', label: '💳 Payments', count: 0 },
    { key: 'recommendations', label: '💡 Recommendations', count: 0 },
    { key: 'harvestBatches', label: '🌾 Harvest Batches', count: 0 }
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
        default:
          response = { data: [] };
      }
      setData(response.data);
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

  const renderTable = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (data.length === 0) return <div className="no-data">No data available</div>;

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
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
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