const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5011;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================

// Grower Login with Email and Password
app.post('/api/auth/grower-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    const connection = await pool.getConnection();
    const [growers] = await connection.query(
      'SELECT * FROM Grower WHERE Email = ?',
      [email]
    );
    connection.release();
    
    if (growers.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const grower = growers[0];
    const validPassword = password === grower.PasswordHash;
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: grower.GrowerID, type: 'grower' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: grower.GrowerID,
        type: 'grower',
        name: grower.Name,
        email: grower.Email,
        contactNo: grower.ContactNo,
        address: grower.Address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Grower Registration with Email and Password
app.post('/api/auth/grower-register', async (req, res) => {
  try {
    const { name, email, contactNo, address, password } = req.body;
    
    if (!name || !email || !contactNo || !address || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO Grower (Name, Email, ContactNo, Address, PasswordHash) VALUES (?, ?, ?, ?, ?)',
      [name, email, contactNo, address, password]
    );
    
    const [growers] = await connection.query(
      'SELECT * FROM Grower WHERE Email = ?',
      [email]
    );
    connection.release();
    
    const grower = growers[0];
    const token = jwt.sign(
      { id: grower.GrowerID, type: 'grower' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: grower.GrowerID,
        type: 'grower',
        name: grower.Name,
        email: grower.Email,
        contactNo: grower.ContactNo,
        address: grower.Address
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer Registration with Password
app.post('/api/auth/customer-register', async (req, res) => {
  try {
    const { name, email, contactNo, address, password } = req.body;
    
    if (!name || !email || !contactNo || !address || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO Customer (Name, Email, ContactNo, Address, PasswordHash) VALUES (?, ?, ?, ?, ?)',
      [name, email, contactNo, address, password]
    );
    
    const [customers] = await connection.query(
      'SELECT * FROM Customer WHERE Email = ?',
      [email]
    );
    connection.release();
    
    const customer = customers[0];
    const token = jwt.sign(
      { id: customer.CustomerID, type: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: customer.CustomerID,
        type: 'customer',
        ...customer
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer Login
app.post('/api/auth/customer-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    const connection = await pool.getConnection();
    const [customers] = await connection.query(
      'SELECT * FROM Customer WHERE Email = ?',
      [email]
    );
    connection.release();
    
    if (customers.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const customer = customers[0];
    const validPassword = password === customer.PasswordHash;
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: customer.CustomerID, type: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: customer.CustomerID,
        type: 'customer',
        name: customer.Name,
        email: customer.Email,
        contactNo: customer.ContactNo,
        address: customer.Address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    
    // Hardcoded admin credentials (in production, store in database)
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    
    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    const token = jwt.sign(
      { id: 'admin', type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: 'admin',
        type: 'admin',
        name: 'Administrator'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get All Growers
app.get('/api/admin/growers', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [growers] = await connection.query('SELECT * FROM Grower');
    connection.release();
    res.json(growers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Grower
app.put('/api/admin/growers/:id', verifyToken, async (req, res) => {
  try {
    const { name, contactNo, address } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE Grower SET Name = ?, ContactNo = ?, Address = ? WHERE GrowerID = ?',
      [name, contactNo, address, req.params.id]
    );
    const [grower] = await connection.query('SELECT * FROM Grower WHERE GrowerID = ?', [req.params.id]);
    connection.release();
    res.json(grower[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Products
app.get('/api/admin/products', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query(
      'SELECT p.*, g.Name as GrowerName FROM Product p JOIN Grower g ON p.GrowerID = g.GrowerID'
    );
    connection.release();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Product
app.put('/api/admin/products/:id', verifyToken, async (req, res) => {
  try {
    const { name, category, pricePerUnit } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE Product SET Name = ?, Category = ?, PricePerUnit = ? WHERE ProductID = ?',
      [name, category, pricePerUnit, req.params.id]
    );
    const [product] = await connection.query('SELECT * FROM Product WHERE ProductID = ?', [req.params.id]);
    connection.release();
    res.json(product[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Orders
app.get('/api/admin/orders', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [orders] = await connection.query(
      'SELECT o.*, c.Name as CustomerName, c.Email FROM `Order` o JOIN Customer c ON o.CustomerID = c.CustomerID ORDER BY o.OrderDate DESC'
    );
    connection.release();
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Order Status
app.put('/api/admin/orders/:id', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE `Order` SET Status = ? WHERE OrderID = ?',
      [status, req.params.id]
    );
    const [order] = await connection.query('SELECT * FROM `Order` WHERE OrderID = ?', [req.params.id]);
    connection.release();
    res.json(order[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Customers
app.get('/api/admin/customers', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [customers] = await connection.query('SELECT CustomerID, Name, Email, ContactNo, Address, CreatedAt FROM Customer');
    connection.release();
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Customer
app.put('/api/admin/customers/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, contactNo, address } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE Customer SET Name = ?, Email = ?, ContactNo = ?, Address = ? WHERE CustomerID = ?',
      [name, email, contactNo, address, req.params.id]
    );
    const [customer] = await connection.query('SELECT * FROM Customer WHERE CustomerID = ?', [req.params.id]);
    connection.release();
    res.json(customer[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Payments
app.get('/api/admin/payments', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [payments] = await connection.query(
      'SELECT p.*, o.OrderID FROM Payment p JOIN `Order` o ON p.OrderID = o.OrderID'
    );
    connection.release();
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Recommendations
app.get('/api/admin/recommendations', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [recommendations] = await connection.query(
      'SELECT r.*, g.Name as GrowerName, p.Name as ProductName FROM Recommendation r JOIN Grower g ON r.GrowerID = g.GrowerID JOIN Product p ON r.ProductID = p.ProductID'
    );
    connection.release();
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Harvest Batches
app.get('/api/admin/harvest-batches', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [batches] = await connection.query(
      'SELECT hb.*, p.Name as ProductName FROM HarvestBatch hb JOIN Product p ON hb.ProductID = p.ProductID'
    );
    connection.release();
    res.json(batches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complex Queries Routes
app.get('/api/admin/complex-queries/grower-performance', verifyToken, async (req, res) => {
  try {
    const { getGrowerPerformanceSimple } = require('./databaseObjects');
    const result = await getGrowerPerformanceSimple();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/complex-queries/monthly-category-sales', verifyToken, async (req, res) => {
  try {
    const { getMonthlyCategorySales } = require('./databaseObjects');
    const result = await getMonthlyCategorySales();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/complex-queries/customer-statistics', verifyToken, async (req, res) => {
  try {
    const { getCustomerStatistics } = require('./databaseObjects');
    const result = await getCustomerStatistics();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/complex-queries/batch-status-monitoring', verifyToken, async (req, res) => {
  try {
    const { getBatchStatusMonitoring } = require('./databaseObjects');
    const result = await getBatchStatusMonitoring();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/complex-queries/recommendation-performance', verifyToken, async (req, res) => {
  try {
    const { getRecommendationPerformance } = require('./databaseObjects');
    const result = await getRecommendationPerformance();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== GROWER ROUTES ====================

// Get Grower Details
app.get('/api/growers/:id', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [growers] = await connection.query(
      'SELECT * FROM Grower WHERE GrowerID = ?',
      [req.params.id]
    );
    connection.release();
    
    if (growers.length === 0) {
      return res.status(404).json({ message: 'Grower not found' });
    }
    
    res.json(growers[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Grower's Plots
app.get('/api/growers/:id/plots', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [plots] = await connection.query(
      'SELECT * FROM Plot WHERE GrowerID = ?',
      [req.params.id]
    );
    connection.release();
    
    res.json(plots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PRODUCT ROUTES ====================

// Get All Products
app.get('/api/products', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query(`
      SELECT p.*, g.Name as GrowerName, 
             COALESCE(SUM(hb.QuantityAvailable), 0) as TotalQuantity
      FROM Product p
      LEFT JOIN Grower g ON p.GrowerID = g.GrowerID
      LEFT JOIN HarvestBatch hb ON p.ProductID = hb.ProductID
      GROUP BY p.ProductID
    `);
    connection.release();
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Grower's Products
app.get('/api/growers/:id/products', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.query(
      'SELECT * FROM Product WHERE GrowerID = ?',
      [req.params.id]
    );
    connection.release();
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Product (Grower)
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const { name, category, pricePerUnit, growerID } = req.body;
    
    if (!name || !category || !pricePerUnit || !growerID) {
      return res.status(400).json({ message: 'All fields required' });
    }
    
    const connection = await pool.getConnection();
    const result = await connection.query(
      'INSERT INTO Product (Name, Category, PricePerUnit, GrowerID) VALUES (?, ?, ?, ?)',
      [name, category, pricePerUnit, growerID]
    );
    
    const [newProduct] = await connection.query(
      'SELECT * FROM Product WHERE ProductID = ?',
      [result[0].insertId]
    );
    connection.release();
    
    res.json(newProduct[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Harvest Batch
app.post('/api/harvest-batch', verifyToken, async (req, res) => {
  try {
    const { productID, batchNo, harvestDate, expiryDate, quantityAvailable } = req.body;
    
    if (!productID || !batchNo || !harvestDate || !expiryDate || !quantityAvailable) {
      return res.status(400).json({ message: 'All fields required' });
    }
    
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO HarvestBatch (ProductID, BatchNo, HarvestDate, ExpiryDate, QuantityAvailable) VALUES (?, ?, ?, ?, ?)',
      [productID, batchNo, harvestDate, expiryDate, quantityAvailable]
    );
    
    const [batch] = await connection.query(
      'SELECT * FROM HarvestBatch WHERE ProductID = ? AND BatchNo = ?',
      [productID, batchNo]
    );
    connection.release();
    
    res.json(batch[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== RECOMMENDATION ROUTES ====================

// Get Recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const { season, soilType, townName } = req.query;
    
    let query = 'SELECT * FROM Recommendation WHERE 1=1';
    const params = [];
    
    if (season) {
      query += ' AND Season = ?';
      params.push(season);
    }
    if (soilType) {
      query += ' AND SoilType = ?';
      params.push(soilType);
    }
    if (townName) {
      query += ' AND TownName = ?';
      params.push(townName);
    }
    
    const connection = await pool.getConnection();
    const [recommendations] = await connection.query(query, params);
    connection.release();
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Recommendation (Grower)
app.post('/api/recommendations', verifyToken, async (req, res) => {
  try {
    const { townName, climateType, season, recommendedCrop, benefits, expectedYield, soilType, recommendedPractices, growerID } = req.body;
    
    const connection = await pool.getConnection();
    const result = await connection.query(
      `INSERT INTO Recommendation (TownName, ClimateType, Season, RecommendedCrop, Benefits, ExpectedYield, SoilType, RecommendedPractices, GrowerID) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [townName, climateType, season, recommendedCrop, benefits, expectedYield, soilType, recommendedPractices, growerID]
    );
    
    const [recommendation] = await connection.query(
      'SELECT * FROM Recommendation WHERE RecommendationID = ?',
      [result[0].insertId]
    );
    connection.release();
    
    res.json(recommendation[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ORDER & CART ROUTES ====================

// Create Order (from cart)
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { customerID, items } = req.body;
    
    if (!customerID || !items || items.length === 0) {
      return res.status(400).json({ message: 'Invalid order data' });
    }
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        const [products] = await connection.query(
          'SELECT PricePerUnit FROM Product WHERE ProductID = ?',
          [item.productID]
        );
        totalAmount += products[0].PricePerUnit * item.quantity;
      }
      
      // Create order
      const [orderResult] = await connection.query(
        'INSERT INTO `Order` (OrderDate, CustomerID, TotalAmount, Status) VALUES (?, ?, ?, ?)',
        [new Date().toISOString().split('T')[0], customerID, totalAmount, 'pending']
      );
      
      const orderID = orderResult.insertId;
      
      // Add order items
      for (const item of items) {
        const [products] = await connection.query(
          'SELECT PricePerUnit FROM Product WHERE ProductID = ?',
          [item.productID]
        );
        const subtotal = products[0].PricePerUnit * item.quantity;
        
        await connection.query(
          'INSERT INTO OrderItem (OrderID, ProductID, Quantity, Subtotal) VALUES (?, ?, ?, ?)',
          [orderID, item.productID, item.quantity, subtotal]
        );
      }
      
      await connection.commit();
      
      const [order] = await connection.query(
        'SELECT * FROM `Order` WHERE OrderID = ?',
        [orderID]
      );
      
      res.json(order[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Customer Orders
app.get('/api/customers/:id/orders', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [orders] = await connection.query(
      'SELECT * FROM `Order` WHERE CustomerID = ? ORDER BY OrderDate DESC',
      [req.params.id]
    );
    connection.release();
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Order Items
app.get('/api/orders/:id/items', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [items] = await connection.query(`
      SELECT oi.*, p.Name, p.Category, p.PricePerUnit
      FROM OrderItem oi
      JOIN Product p ON oi.ProductID = p.ProductID
      WHERE oi.OrderID = ?
    `, [req.params.id]);
    connection.release();
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PAYMENT ROUTES ====================

// Create Payment
app.post('/api/payments', verifyToken, async (req, res) => {
  try {
    const { orderID, mode, amount } = req.body;
    
    if (!orderID || !mode || !amount) {
      return res.status(400).json({ message: 'All fields required' });
    }
    
    const connection = await pool.getConnection();
    const result = await connection.query(
      'INSERT INTO Payment (Mode, Status, OrderID, Amount) VALUES (?, ?, ?, ?)',
      [mode, 'completed', orderID, amount]
    );
    
    // Update order status
    await connection.query(
      'UPDATE `Order` SET Status = ? WHERE OrderID = ?',
      ['confirmed', orderID]
    );
    
    const [payment] = await connection.query(
      'SELECT * FROM Payment WHERE PaymentID = ?',
      [result[0].insertId]
    );
    connection.release();
    
    res.json(payment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Order Payment
app.get('/api/orders/:id/payment', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [payment] = await connection.query(
      'SELECT * FROM Payment WHERE OrderID = ?',
      [req.params.id]
    );
    connection.release();
    
    res.json(payment.length > 0 ? payment[0] : null);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADVANCED FEATURES (Using Database Objects) ====================

// Import database objects module
const dbObjects = require('./databaseObjects');

// =====================================================
// Process Order using Stored Procedure
// =====================================================
// This endpoint uses the sp_process_order stored procedure
// which handles complete order processing with transactions
app.post('/api/orders/process-complete', verifyToken, async (req, res) => {
  try {
    const { customerID, orderDate, paymentMode, items } = req.body;
    
    if (!customerID || !orderDate || !paymentMode || !items || items.length === 0) {
      return res.status(400).json({ message: 'All fields required' });
    }
    
    const result = await dbObjects.processOrderComplete(
      customerID,
      orderDate,
      paymentMode,
      items
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// Get Grower Revenue (Using Function)
// =====================================================
// This endpoint uses the fn_calculate_grower_revenue function
// to calculate total revenue for a grower within a date range
app.get('/api/growers/:id/revenue', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const growerID = req.params.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date required' });
    }
    
    const result = await dbObjects.getGrowerRevenue(growerID, startDate, endDate);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// Get Grower Performance Dashboard
// =====================================================
// Exposes aggregated analytics for all growers to the admin UI
app.get('/api/admin/grower-performance', verifyToken, async (req, res) => {
  try {
    const result = await dbObjects.getGrowerPerformanceDashboard();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// Get Single Grower Performance
// =====================================================
// Fetches performance metrics for a specific grower
app.get('/api/growers/:id/performance', verifyToken, async (req, res) => {
  try {
    const result = await dbObjects.getGrowerPerformance(req.params.id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// Test Triggers
// =====================================================
// This endpoint tests if the database triggers are working correctly
app.post('/api/database/test-triggers', verifyToken, async (req, res) => {
  try {
    const result = await dbObjects.testTriggers();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});