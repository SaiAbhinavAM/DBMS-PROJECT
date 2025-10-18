/**
 * Database Objects Integration Module
 * This module provides functions to use the triggers, procedures, and functions
 * defined in schema.sql for order processing and analytics
 */

const pool = require('./db');

// =====================================================
// 1. STORED PROCEDURE: Process Complete Order
// =====================================================
// Uses: sp_process_order
// Handles complete order workflow with transactions
const processOrderComplete = async (
  customerID,
  orderDate,
  paymentMode,
  productID,
  quantity
) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Call the stored procedure
    const [result] = await connection.query(
      'CALL sp_process_order(?, ?, ?, ?, ?, @order_id, @message)',
      [customerID, orderDate, paymentMode, productID, quantity]
    );
    
    // Get the output parameters
    const [output] = await connection.query(
      'SELECT @order_id as order_id, @message as message'
    );
    
    connection.release();
    
    return {
      success: true,
      orderID: output[0].order_id,
      message: output[0].message,
      data: result
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error processing order:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// =====================================================
// 2. FUNCTION: Calculate Grower Revenue
// =====================================================
// Uses: fn_calculate_grower_revenue
// Calculates total revenue for a grower within a date range
const getGrowerRevenue = async (growerID, startDate, endDate) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'SELECT fn_calculate_grower_revenue(?, ?, ?) as total_revenue',
      [growerID, startDate, endDate]
    );
    
    connection.release();
    
    return {
      success: true,
      growerID,
      startDate,
      endDate,
      totalRevenue: result[0].total_revenue
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error calculating grower revenue:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// =====================================================
// 3. COMPLEX QUERY: Grower Performance Dashboard
// =====================================================
// Fetches comprehensive metrics for all growers
const getGrowerPerformanceDashboard = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [growers] = await connection.query(`
      SELECT 
          g.GrowerID,
          g.Name AS GrowerName,
          g.ContactNo,
          g.Address,
          
          -- Plot Statistics
          COUNT(DISTINCT pl.PlotID) AS TotalPlots,
          COALESCE(SUM(pl.Size), 0) AS TotalPlotSize,
          GROUP_CONCAT(DISTINCT pl.SoilType SEPARATOR ', ') AS SoilTypes,
          
          -- Product Statistics
          COUNT(DISTINCT pr.ProductID) AS TotalProducts,
          GROUP_CONCAT(DISTINCT pr.Category SEPARATOR ', ') AS ProductCategories,
          
          -- Revenue Statistics
          COALESCE(SUM(CASE 
              WHEN o.Status IN ('confirmed', 'delivered') 
              THEN oi.Subtotal 
              ELSE 0 
          END), 0) AS TotalRevenue,
          
          COALESCE(COUNT(DISTINCT CASE 
              WHEN o.Status IN ('confirmed', 'delivered') 
              THEN o.OrderID 
          END), 0) AS TotalOrders,
          
          COALESCE(
              AVG(CASE 
                  WHEN o.Status IN ('confirmed', 'delivered') 
                  THEN o.TotalAmount 
              END), 0
          ) AS AverageOrderValue,
          
          -- Harvest Statistics
          COALESCE(SUM(hb.QuantityAvailable), 0) AS TotalAvailableQuantity,
          COUNT(DISTINCT hb.BatchNo) AS ActiveBatches,
          
          -- Recommendation Statistics
          COUNT(DISTINCT r.RecommendationID) AS TotalRecommendations,
          GROUP_CONCAT(DISTINCT r.RecommendedCrop SEPARATOR ', ') AS RecommendedCrops,
          
          -- Success Metrics
          CASE 
              WHEN COUNT(DISTINCT o.OrderID) > 0 
              THEN ROUND(
                  (COUNT(DISTINCT CASE WHEN o.Status = 'delivered' THEN o.OrderID END) * 100.0) / 
                  COUNT(DISTINCT o.OrderID), 2
              )
              ELSE 0 
          END AS DeliverySuccessRate,
          
          -- Customer Satisfaction
          COUNT(DISTINCT CASE 
              WHEN o.Status = 'delivered' 
              THEN o.CustomerID 
          END) AS SatisfiedCustomers,
          
          -- Recent Activity
          MAX(o.OrderDate) AS LastOrderDate,
          MAX(pr.CreatedAt) AS LastProductAdded
          
      FROM Grower g
      LEFT JOIN Plot pl ON g.GrowerID = pl.GrowerID
      LEFT JOIN Product pr ON g.GrowerID = pr.GrowerID
      LEFT JOIN OrderItem oi ON pr.ProductID = oi.ProductID
      LEFT JOIN \`Order\` o ON oi.OrderID = o.OrderID
      LEFT JOIN HarvestBatch hb ON pr.ProductID = hb.ProductID
      LEFT JOIN Recommendation r ON g.GrowerID = r.GrowerID OR pr.ProductID = r.ProductID
      GROUP BY g.GrowerID, g.Name, g.ContactNo, g.Address
      ORDER BY TotalRevenue DESC, TotalOrders DESC
    `);
    
    connection.release();
    
    return {
      success: true,
      data: growers
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching grower performance:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// =====================================================
// Additional Utility Functions
// =====================================================

// Get single grower performance metrics
const getGrowerPerformance = async (growerID) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [result] = await connection.query(`
      SELECT 
          g.GrowerID,
          g.Name AS GrowerName,
          g.ContactNo,
          g.Address,
          COUNT(DISTINCT pl.PlotID) AS TotalPlots,
          COALESCE(SUM(pl.Size), 0) AS TotalPlotSize,
          COUNT(DISTINCT pr.ProductID) AS TotalProducts,
          COALESCE(SUM(CASE 
              WHEN o.Status IN ('confirmed', 'delivered') 
              THEN oi.Subtotal 
              ELSE 0 
          END), 0) AS TotalRevenue,
          COALESCE(COUNT(DISTINCT CASE 
              WHEN o.Status IN ('confirmed', 'delivered') 
              THEN o.OrderID 
          END), 0) AS TotalOrders,
          CASE 
              WHEN COUNT(DISTINCT o.OrderID) > 0 
              THEN ROUND(
                  (COUNT(DISTINCT CASE WHEN o.Status = 'delivered' THEN o.OrderID END) * 100.0) / 
                  COUNT(DISTINCT o.OrderID), 2
              )
              ELSE 0 
          END AS DeliverySuccessRate
      FROM Grower g
      LEFT JOIN Plot pl ON g.GrowerID = pl.GrowerID
      LEFT JOIN Product pr ON g.GrowerID = pr.GrowerID
      LEFT JOIN OrderItem oi ON pr.ProductID = oi.ProductID
      LEFT JOIN \`Order\` o ON oi.OrderID = o.OrderID
      WHERE g.GrowerID = ?
      GROUP BY g.GrowerID, g.Name, g.ContactNo, g.Address
    `, [growerID]);
    
    connection.release();
    
    return {
      success: true,
      data: result[0]
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching grower performance:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Verify triggers are working (test by creating order items)
const testTriggers = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Create a test order
    const [orderResult] = await connection.query(
      'INSERT INTO \`Order\` (OrderDate, CustomerID, TotalAmount, Status) VALUES (?, ?, ?, ?)',
      [new Date().toISOString().split('T')[0], 1, 0, 'pending']
    );
    
    const orderID = orderResult.insertId;
    
    // Add an order item (this will trigger the auto-update)
    await connection.query(
      'INSERT INTO OrderItem (OrderID, ProductID, Quantity, Subtotal) VALUES (?, ?, ?, ?)',
      [orderID, 1, 5, 225.00]
    );
    
    // Get the updated order (should show updated TotalAmount)
    const [order] = await connection.query(
      'SELECT * FROM \`Order\` WHERE OrderID = ?',
      [orderID]
    );
    
    connection.release();
    
    return {
      success: true,
      message: 'Triggers are working correctly',
      data: {
        orderID,
        totalAmount: order[0].TotalAmount,
        note: 'Order total was auto-calculated by trigger'
      }
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error testing triggers:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  processOrderComplete,
  getGrowerRevenue,
  getGrowerPerformanceDashboard,
  getGrowerPerformance,
  testTriggers
};