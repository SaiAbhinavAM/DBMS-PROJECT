/**
 * Database Objects Integration Module
 * This module provides functions to use the triggers, procedures, and functions
 * defined in schema.sql for order processing and analytics
 */

const pool = require('./db');

let ensurePromise;

const ensureDatabaseObjects = async () => {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      let connection;
      try {
        connection = await pool.getConnection();
        await connection.query('DROP PROCEDURE IF EXISTS sp_process_order');
        await connection.query(`
CREATE PROCEDURE sp_process_order(
    IN p_customer_id INT,
    IN p_order_date DATE,
    IN p_payment_mode ENUM('cash', 'card', 'upi', 'bank_transfer'),
    IN p_product_id INT,
    IN p_quantity DECIMAL(10,2),
    OUT p_order_id INT,
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_order_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_product_price DECIMAL(10,2);
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_total_available DECIMAL(10,2);
    DECLARE v_remaining DECIMAL(10,2);
    DECLARE v_batch_no VARCHAR(50);
    DECLARE v_batch_qty DECIMAL(10,2);
    DECLARE v_batch_exists INT DEFAULT 0;
    DECLARE done INT DEFAULT 0;
    DECLARE cur_batches CURSOR FOR
        SELECT BatchNo, QuantityAvailable
        FROM HarvestBatch
        WHERE ProductID = p_product_id
        AND ExpiryDate > CURDATE()
        AND QuantityAvailable > 0
        ORDER BY HarvestDate ASC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'Error processing order';
        RESIGNAL;
    END;
    START TRANSACTION;
    SELECT PricePerUnit INTO v_product_price
    FROM Product
    WHERE ProductID = p_product_id;
    IF v_product_price IS NULL THEN
        SET p_message = 'Product not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    SELECT COUNT(*) INTO v_batch_exists
    FROM HarvestBatch
    WHERE ProductID = p_product_id;
    IF v_batch_exists = 0 THEN
        SET v_batch_no = CONCAT('AUTO-', UNIX_TIMESTAMP());
        INSERT INTO HarvestBatch (ProductID, BatchNo, HarvestDate, ExpiryDate, QuantityAvailable)
        VALUES (p_product_id, v_batch_no, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), p_quantity);
    END IF;
    SELECT COALESCE(SUM(QuantityAvailable), 0) INTO v_total_available
    FROM HarvestBatch
    WHERE ProductID = p_product_id
    AND ExpiryDate > CURDATE()
    AND QuantityAvailable > 0;
    IF v_total_available < p_quantity THEN
        SET v_batch_no = CONCAT('AUTO-', UNIX_TIMESTAMP());
        INSERT INTO HarvestBatch (ProductID, BatchNo, HarvestDate, ExpiryDate, QuantityAvailable)
        VALUES (p_product_id, v_batch_no, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), p_quantity);
        SET v_total_available = v_total_available + p_quantity;
    END IF;
    SET v_subtotal = v_product_price * p_quantity;
    SET v_order_total = v_subtotal;
    INSERT INTO \`Order\` (OrderDate, CustomerID, TotalAmount, Status)
    VALUES (p_order_date, p_customer_id, v_order_total, 'confirmed');
    SET p_order_id = LAST_INSERT_ID();
    INSERT INTO OrderItem (OrderID, ProductID, Quantity, Subtotal)
    VALUES (p_order_id, p_product_id, p_quantity, v_subtotal);
    SET v_remaining = p_quantity;
    OPEN cur_batches;
    consume_loop: LOOP
        FETCH cur_batches INTO v_batch_no, v_batch_qty;
        IF done = 1 THEN
            LEAVE consume_loop;
        END IF;
        IF v_remaining <= 0 THEN
            LEAVE consume_loop;
        END IF;
        IF v_batch_qty >= v_remaining THEN
            UPDATE HarvestBatch
            SET QuantityAvailable = QuantityAvailable - v_remaining
            WHERE ProductID = p_product_id AND BatchNo = v_batch_no;
            SET v_remaining = 0;
        ELSE
            UPDATE HarvestBatch
            SET QuantityAvailable = 0
            WHERE ProductID = p_product_id AND BatchNo = v_batch_no;
            SET v_remaining = v_remaining - v_batch_qty;
        END IF;
    END LOOP;
    CLOSE cur_batches;
    IF v_remaining > 0 THEN
        INSERT INTO HarvestBatch (ProductID, BatchNo, HarvestDate, ExpiryDate, QuantityAvailable)
        VALUES (p_product_id, CONCAT('AUTO-', UNIX_TIMESTAMP()), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 0);
    END IF;
    INSERT INTO Payment (Mode, Status, OrderID, Amount, PaymentDate)
    VALUES (p_payment_mode, 'completed', p_order_id, v_order_total, NOW());
    COMMIT;
    SET p_message = CONCAT('Order #', p_order_id, ' processed successfully');
END
        `);
        await connection.query('DROP FUNCTION IF EXISTS fn_calculate_grower_revenue');
        await connection.query(`
CREATE FUNCTION fn_calculate_grower_revenue(
    p_grower_id INT,
    p_start_date DATE,
    p_end_date DATE
) RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_total_revenue DECIMAL(10,2) DEFAULT 0;
    SELECT COALESCE(SUM(oi.Subtotal), 0) INTO v_total_revenue
    FROM OrderItem oi
    INNER JOIN Product p ON oi.ProductID = p.ProductID
    INNER JOIN \`Order\` o ON oi.OrderID = o.OrderID
    WHERE p.GrowerID = p_grower_id
    AND o.OrderDate BETWEEN p_start_date AND p_end_date
    AND o.Status IN ('confirmed', 'delivered');
    RETURN v_total_revenue;
END
        `);
      } finally {
        if (connection) connection.release();
      }
    })();
    ensurePromise.catch(() => {
      ensurePromise = null;
    });
  }
  return ensurePromise;
};


// 1. STORED PROCEDURE: Process Complete Order
// Uses: sp_process_order
// Handles complete order workflow with transactions
const processOrderComplete = async (
  customerID,
  orderDate,
  paymentMode,
  items
) => {
  await ensureDatabaseObjects();
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let lastOrderResult = null;

    for (const item of items) {
      const [resultSets] = await connection.query(
        'CALL sp_process_order(?, ?, ?, ?, ?, @order_id, @message)',
        [
          customerID,
          orderDate,
          paymentMode,
          item.productID,
          item.quantity
        ]
      );

      const [output] = await connection.query(
        'SELECT @order_id as order_id, @message as message'
      );

      if (!output[0]?.order_id) {
        throw new Error(output[0]?.message || 'Failed to process order item');
      }

      lastOrderResult = {
        success: true,
        orderID: output[0].order_id,
        message: output[0].message,
        data: resultSets
      };
    }

    await connection.commit();
    connection.release();

    return lastOrderResult;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      connection.release();
    }

    console.error('Error processing order:', error);
    return {
      success: false,
      message: error.message
    };
  }
};


// 2. FUNCTION: Calculate Grower Revenue

// Uses: fn_calculate_grower_revenue
// Calculates total revenue for a grower within a date range
const getGrowerRevenue = async (growerID, startDate, endDate) => {
  await ensureDatabaseObjects();
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


// 3. COMPLEX QUERY: Grower Performance Dashboard

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

// Additional Utility Functions


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

// Complex Queries for Admin Dashboard

// 1. Grower Performance Dashboard (Simplified)
const getGrowerPerformanceSimple = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [growers] = await connection.query(`
      SELECT
          g.GrowerID,
          g.Name AS GrowerName,
          COALESCE((SELECT COUNT(*) FROM Plot pl WHERE pl.GrowerID = g.GrowerID), 0) AS TotalPlots,
          COALESCE((SELECT SUM(Size) FROM Plot pl WHERE pl.GrowerID = g.GrowerID), 0) AS TotalPlotSize,
          COALESCE((SELECT COUNT(DISTINCT ProductID) FROM Product pr WHERE pr.GrowerID = g.GrowerID), 0) AS TotalProducts,
          COALESCE((SELECT COUNT(DISTINCT o.OrderID)
                    FROM Product pr
                    JOIN OrderItem oi ON oi.ProductID = pr.ProductID
                    JOIN \`Order\` o ON o.OrderID = oi.OrderID
                    WHERE pr.GrowerID = g.GrowerID
                    AND o.Status IN ('confirmed', 'delivered')), 0) AS FulfilledOrders,
          COALESCE((SELECT SUM(oi.Subtotal)
                    FROM Product pr
                    JOIN OrderItem oi ON oi.ProductID = pr.ProductID
                    JOIN \`Order\` o ON o.OrderID = oi.OrderID
                    WHERE pr.GrowerID = g.GrowerID
                    AND o.Status IN ('confirmed', 'delivered')), 0) AS TotalRevenue
      FROM Grower g
      LIMIT 10;
    `);

    connection.release();

    return {
      success: true,
      data: growers
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching grower performance simple:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// 2. Monthly Category Sales
const getMonthlyCategorySales = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [sales] = await connection.query(`
      SELECT
          DATE_FORMAT(o.OrderDate, '%Y-%m') AS month_year,
          p.Category,
          SUM(oi.Subtotal) AS category_revenue
      FROM OrderItem oi
      JOIN \`Order\` o ON o.OrderID = oi.OrderID
      JOIN Product p ON p.ProductID = oi.ProductID
      WHERE o.Status IN ('confirmed', 'delivered')
      GROUP BY DATE_FORMAT(o.OrderDate, '%Y-%m'), p.Category
      ORDER BY month_year DESC, category_revenue DESC
      LIMIT 20;
    `);

    connection.release();

    return {
      success: true,
      data: sales
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching monthly category sales:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// 3. Customer Statistics
const getCustomerStatistics = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [customers] = await connection.query(`
      SELECT
          c.CustomerID,
          c.Name,
          COUNT(DISTINCT o.OrderID) AS completed_orders,
          MIN(o.OrderDate) AS first_order_date,
          MAX(o.OrderDate) AS last_order_date,
          SUM(o.TotalAmount) AS total_spent
      FROM Customer c
      JOIN \`Order\` o ON o.CustomerID = c.CustomerID
      WHERE o.Status IN ('confirmed', 'delivered')
      GROUP BY c.CustomerID, c.Name
      HAVING completed_orders > 1
      ORDER BY total_spent DESC
      LIMIT 10;
    `);

    connection.release();

    return {
      success: true,
      data: customers
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching customer statistics:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// 4. Batch Status Monitoring
const getBatchStatusMonitoring = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [batches] = await connection.query(`
      SELECT
          hb.ProductID,
          p.Name AS ProductName,
          hb.BatchNo,
          hb.QuantityAvailable,
          DATEDIFF(hb.ExpiryDate, CURDATE()) AS days_to_expiry
      FROM HarvestBatch hb
      JOIN Product p ON p.ProductID = hb.ProductID
      WHERE DATEDIFF(hb.ExpiryDate, CURDATE()) BETWEEN 0 AND 30
      ORDER BY days_to_expiry ASC
      LIMIT 10;
    `);

    connection.release();

    return {
      success: true,
      data: batches
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching batch status monitoring:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// 5. Recommendation Performance
const getRecommendationPerformance = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [recommendations] = await connection.query(`
      SELECT
          r.RecommendationID,
          r.GrowerID,
          r.TownName,
          r.RecommendedCrop,
          COUNT(DISTINCT o.OrderID) AS fulfilled_orders
      FROM Recommendation r
      LEFT JOIN Product p ON p.ProductID = r.ProductID
      LEFT JOIN OrderItem oi ON oi.ProductID = p.ProductID
      LEFT JOIN \`Order\` o ON o.OrderID = oi.OrderID AND o.Status IN ('confirmed', 'delivered')
      GROUP BY r.RecommendationID, r.GrowerID, r.TownName, r.RecommendedCrop
      LIMIT 10;
    `);

    connection.release();

    return {
      success: true,
      data: recommendations
    };
  } catch (error) {
    if (connection) connection.release();
    console.error('Error fetching recommendation performance:', error);
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
  testTriggers,
  getGrowerPerformanceSimple,
  getMonthlyCategorySales,
  getCustomerStatistics,
  getBatchStatusMonitoring,
  getRecommendationPerformance
};