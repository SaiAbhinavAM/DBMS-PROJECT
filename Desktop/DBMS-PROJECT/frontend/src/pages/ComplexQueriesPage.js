import React, { useState } from 'react';
import { adminAPI } from '../services/api';

const ComplexQueriesPage = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');

  const queries = [
    {
      key: 'growerPerformance',
      title: 'Grower Performance Dashboard',
      description: 'View comprehensive metrics for all growers including plots, products, orders, and revenue',
      apiCall: adminAPI.getGrowerPerformance,
      columns: ['GrowerID', 'GrowerName', 'TotalPlots', 'TotalPlotSize', 'TotalProducts', 'FulfilledOrders', 'TotalRevenue']
    },
    {
      key: 'monthlyCategorySales',
      title: 'Monthly Category Sales',
      description: 'Monthly revenue breakdown by product category',
      apiCall: adminAPI.getMonthlyCategorySales,
      columns: ['month_year', 'Category', 'category_revenue']
    },
    {
      key: 'customerStatistics',
      title: 'Customer Statistics',
      description: 'Top customers with multiple orders and their spending patterns',
      apiCall: adminAPI.getCustomerStatistics,
      columns: ['CustomerID', 'Name', 'completed_orders', 'first_order_date', 'last_order_date', 'total_spent']
    },
    {
      key: 'batchStatusMonitoring',
      title: 'Batch Status Monitoring',
      description: 'Harvest batches expiring within 30 days that need attention',
      apiCall: adminAPI.getBatchStatusMonitoring,
      columns: ['ProductID', 'ProductName', 'BatchNo', 'QuantityAvailable', 'days_to_expiry']
    },
    {
      key: 'recommendationPerformance',
      title: 'Recommendation Performance',
      description: 'Performance metrics for crop recommendations and their fulfillment',
      apiCall: adminAPI.getRecommendationPerformance,
      columns: ['RecommendationID', 'GrowerID', 'TownName', 'RecommendedCrop', 'fulfilled_orders']
    }
  ];

  const executeQuery = async (queryKey, apiCall) => {
    setLoading(prev => ({ ...prev, [queryKey]: true }));
    setError('');

    try {
      const response = await apiCall();
      setResults(prev => ({ ...prev, [queryKey]: response.data }));
    } catch (err) {
      setError(`Failed to execute ${queryKey}: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, [queryKey]: false }));
    }
  };

  const renderTable = (queryKey, columns) => {
    const data = results[queryKey];
    if (!data || data.length === 0) {
      return <div style={styles.noData}>No data available. Click "Execute Query" to fetch results.</div>;
    }

    return (
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={styles.tableHeader}>
                  {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} style={styles.tableRow}>
                {columns.map((col) => (
                  <td key={col} style={styles.tableCell}>
                    {typeof item[col] === 'number' && col.includes('Revenue')
                      ? `₹${item[col].toFixed(2)}`
                      : String(item[col] || '').substring(0, 50)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔍 Complex Queries Dashboard</h1>
        <p style={styles.subtitle}>Execute advanced analytical queries to gain insights into your agricultural marketplace</p>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.container}>
        {queries.map((query) => (
          <div key={query.key} style={styles.queryCard}>
            <div style={styles.queryHeader}>
              <h3 style={styles.queryTitle}>{query.title}</h3>
              <p style={styles.queryDescription}>{query.description}</p>
              <button
                style={{
                  ...styles.executeBtn,
                  ...(loading[query.key] ? styles.executeBtnDisabled : {})
                }}
                onClick={() => executeQuery(query.key, query.apiCall)}
                disabled={loading[query.key]}
              >
                {loading[query.key] ? 'Executing...' : 'Execute Query'}
              </button>
            </div>

            <div style={styles.queryResults}>
              {renderTable(query.key, query.columns)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- INLINE STYLES ---------- */
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    padding: '30px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#2c3e50'
  },
  header: {
    textAlign: 'center',
    background: '#fff',
    padding: '25px',
    borderRadius: '10px',
    marginBottom: '30px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
  },
  title: {
    color: '#1e3c72',
    fontSize: '2rem',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#555',
    fontSize: '1rem'
  },
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
    gap: '25px'
  },
  queryCard: {
    background: '#fff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  queryHeader: {
    marginBottom: '20px'
  },
  queryTitle: {
    color: '#1e3c72',
    fontSize: '1.4rem',
    marginBottom: '8px'
  },
  queryDescription: {
    color: '#555',
    fontSize: '0.95rem',
    marginBottom: '15px'
  },
  executeBtn: {
    background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(0,114,255,0.3)'
  },
  executeBtnDisabled: {
    background: '#6c757d',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  queryResults: {
    overflowX: 'auto'
  },
  tableWrapper: {
    width: '100%',
    marginTop: '10px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: '#ecf0f1',
    color: '#1e3c72',
    fontWeight: '600',
    padding: '10px',
    borderBottom: '2px solid #bdc3c7'
  },
  tableRow: {
    background: '#fff',
    transition: 'background-color 0.2s ease'
  },
  tableCell: {
    padding: '10px',
    borderBottom: '1px solid #ecf0f1',
    color: '#34495e'
  },
  noData: {
    textAlign: 'center',
    padding: '15px',
    color: '#7f8c8d',
    fontStyle: 'italic'
  },
  errorBanner: {
    background: '#ffe5e5',
    color: '#c0392b',
    borderLeft: '5px solid #e74c3c',
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '500'
  }
};

export default ComplexQueriesPage;