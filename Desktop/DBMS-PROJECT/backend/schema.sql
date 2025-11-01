-- Urban Farming Management System Database Schema
-- Drop database if exists and create new one
DROP DATABASE IF EXISTS urban_farming;
CREATE DATABASE urban_farming;
USE urban_farming;

-- Grower table
CREATE TABLE Grower (
    GrowerID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    ContactNo VARCHAR(15) NOT NULL,
    Address TEXT NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Plot table
CREATE TABLE Plot (
    PlotID INT AUTO_INCREMENT PRIMARY KEY,
    Location VARCHAR(200) NOT NULL,
    Size DECIMAL(10,2) NOT NULL, -- Size in acres or square meters
    SoilType VARCHAR(50) NOT NULL,
    GrowerID INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (GrowerID) REFERENCES Grower(GrowerID) ON DELETE CASCADE
);

-- Product table
CREATE TABLE Product (
    ProductID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    PricePerUnit DECIMAL(10,2) NOT NULL,
    GrowerID INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (GrowerID) REFERENCES Grower(GrowerID) ON DELETE CASCADE
);

-- HarvestBatch table (weak entity)
CREATE TABLE HarvestBatch (
    ProductID INT NOT NULL,
    BatchNo VARCHAR(50) NOT NULL,
    HarvestDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    QuantityAvailable DECIMAL(10,2) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ProductID, BatchNo),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE
);

-- Customer table
CREATE TABLE Customer (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    -- Authentication fields
    Email VARCHAR(150) UNIQUE NULL,
    ContactNo VARCHAR(15) NOT NULL,
    PasswordHash VARCHAR(255) NULL,
    Address TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Order table
CREATE TABLE `Order` (
    OrderID INT AUTO_INCREMENT PRIMARY KEY,
    OrderDate DATE NOT NULL,
    CustomerID INT NOT NULL,
    TotalAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
    Status ENUM('pending', 'confirmed', 'delivered', 'cancelled') DEFAULT 'pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE CASCADE
);

-- OrderItem table (weak entity)
CREATE TABLE OrderItem (
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (OrderID, ProductID),
    FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE
);

-- Payment table
CREATE TABLE Payment (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    Mode ENUM('cash', 'card', 'upi', 'bank_transfer') NOT NULL,
    Status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    OrderID INT UNIQUE NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID) ON DELETE CASCADE
);

-- Recommendation table
CREATE TABLE Recommendation (
    RecommendationID INT AUTO_INCREMENT PRIMARY KEY,
    TownName VARCHAR(100) NOT NULL,
    ClimateType VARCHAR(50) NOT NULL,
    Season VARCHAR(20) NOT NULL,
    RecommendedCrop VARCHAR(100) NOT NULL,
    Benefits TEXT,
    ExpectedYield DECIMAL(10,2),
    SoilType VARCHAR(50) NOT NULL,
    RecommendedPractices TEXT,
    ProductID INT,
    GrowerID INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE SET NULL,
    FOREIGN KEY (GrowerID) REFERENCES Grower(GrowerID) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_plot_grower ON Plot(GrowerID);
CREATE INDEX idx_product_grower ON Product(GrowerID);
CREATE INDEX idx_order_customer ON `Order`(CustomerID);
CREATE INDEX idx_order_date ON `Order`(OrderDate);
CREATE INDEX idx_recommendation_town ON Recommendation(TownName);
CREATE INDEX idx_recommendation_season ON Recommendation(Season);

-- Insert some sample data
-- Sample passwords: john123, maria123, david123
INSERT INTO Grower (Name, Email, ContactNo, Address, PasswordHash) VALUES
('John Smith', 'john@farmmail.com', '9876543210', '123 Farm Road, Green Valley, State 12345', 'john123'),
('Maria Garcia', 'maria@farmmail.com', '9876543211', '456 Harvest Lane, Sunny Hills, State 12346', 'maria123'),
('David Johnson', 'david@farmmail.com', '9876543212', '789 Crop Street, Garden City, State 12347', 'david123');

INSERT INTO Customer (Name, Email, ContactNo, PasswordHash, Address) VALUES
('Alice Brown', 'alice@customer.com', '8765432109', 'alice123', '321 Main Street, Downtown, City 54321'),
('Bob Wilson', 'bob@customer.com', '8765432108', 'bob123', '654 Oak Avenue, Suburb, City 54322'),
('Carol Davis', 'carol@customer.com', '8765432107', 'carol123', '987 Pine Street, Uptown, City 54323');

INSERT INTO Plot (Location, Size, SoilType, GrowerID) VALUES
('North Field', 2.5, 'Loamy', 1),
('South Field', 1.8, 'Sandy', 1),
('East Garden', 3.2, 'Clay', 2),
('West Plot', 2.0, 'Loamy', 3);

INSERT INTO Product (Name, Category, PricePerUnit, GrowerID) VALUES
('Organic Tomatoes', 'Vegetables', 45.00, 1),
('Fresh Lettuce', 'Leafy Greens', 25.00, 1),
('Bell Peppers', 'Vegetables', 35.00, 2),
('Carrots', 'Root Vegetables', 30.00, 2),
('Spinach', 'Leafy Greens', 20.00, 3);

INSERT INTO Recommendation (TownName, ClimateType, Season, RecommendedCrop, Benefits, ExpectedYield, SoilType, RecommendedPractices, ProductID, GrowerID) VALUES
('Green Valley', 'Temperate', 'Spring', 'Tomatoes', 'High nutritional value, good market demand', 8.5, 'Loamy', 'Use drip irrigation, apply organic fertilizer every 2 weeks', 1, 1),
('Sunny Hills', 'Mediterranean', 'Summer', 'Bell Peppers', 'Rich in vitamins, drought resistant', 6.2, 'Sandy', 'Mulch around plants, provide shade during peak sun hours', 3, 2),
('Garden City', 'Continental', 'Fall', 'Carrots', 'Long storage life, cold hardy', 12.0, 'Loamy', 'Plant in raised beds, thin seedlings regularly', 4, 2);


-- TRIGGERS, PROCEDURES, FUNCTIONS, AND COMPLEX QUERY



-- 1. TRIGGER: Auto-calculate Order Total Amount


DELIMITER $$


CREATE TRIGGER trg_update_order_total_insert
AFTER INSERT ON OrderItem
FOR EACH ROW
BEGIN
    UPDATE `Order`
    SET TotalAmount = (
        SELECT COALESCE(SUM(Subtotal), 0)
        FROM OrderItem
        WHERE OrderID = NEW.OrderID
    )
    WHERE OrderID = NEW.OrderID;
END$$


CREATE TRIGGER trg_update_order_total_update
AFTER UPDATE ON OrderItem
FOR EACH ROW
BEGIN
    UPDATE `Order`
    SET TotalAmount = (
        SELECT COALESCE(SUM(Subtotal), 0)
        FROM OrderItem
        WHERE OrderID = NEW.OrderID
    )
    WHERE OrderID = NEW.OrderID;
END$$


CREATE TRIGGER trg_update_order_total_delete
AFTER DELETE ON OrderItem
FOR EACH ROW
BEGIN
    UPDATE `Order`
    SET TotalAmount = (
        SELECT COALESCE(SUM(Subtotal), 0)
        FROM OrderItem
        WHERE OrderID = OLD.OrderID
    )
    WHERE OrderID = OLD.OrderID;
END$$

DELIMITER ;


-- 2. STORED PROCEDURE: Process Complete Order


DELIMITER $$


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
    DECLARE v_available_qty DECIMAL(10,2);
    DECLARE v_batch_no VARCHAR(50);
    DECLARE v_insufficient_stock BOOLEAN DEFAULT FALSE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'Error processing order';
        RESIGNAL;
    END;

    -- Start transaction
    START TRANSACTION;

    -- Get product price
    SELECT PricePerUnit INTO v_product_price
    FROM Product
    WHERE ProductID = p_product_id;

    IF v_product_price IS NULL THEN
        SET p_message = 'Product not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check available quantity in harvest batches
    SELECT QuantityAvailable, BatchNo INTO v_available_qty, v_batch_no
    FROM HarvestBatch
    WHERE ProductID = p_product_id
    AND QuantityAvailable >= p_quantity
    AND ExpiryDate > CURDATE()
    ORDER BY HarvestDate ASC
    LIMIT 1;

    IF v_available_qty IS NULL THEN
        SET p_message = 'Insufficient stock or product expired';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Calculate subtotal
    SET v_subtotal = v_product_price * p_quantity;
    SET v_order_total = v_subtotal;

    -- Create order
    INSERT INTO `Order` (OrderDate, CustomerID, TotalAmount, Status)
    VALUES (p_order_date, p_customer_id, v_order_total, 'confirmed');

    SET p_order_id = LAST_INSERT_ID();

    -- Add order item
    INSERT INTO OrderItem (OrderID, ProductID, Quantity, Subtotal)
    VALUES (p_order_id, p_product_id, p_quantity, v_subtotal);

    -- Update harvest batch quantity
    UPDATE HarvestBatch
    SET QuantityAvailable = QuantityAvailable - p_quantity
    WHERE ProductID = p_product_id AND BatchNo = v_batch_no;

    -- Create payment record
    INSERT INTO Payment (Mode, Status, OrderID, Amount, PaymentDate)
    VALUES (p_payment_mode, 'completed', p_order_id, v_order_total, NOW());

    -- Commit transaction
    COMMIT;
    SET p_message = CONCAT('Order #', p_order_id, ' processed successfully');

END$$

DELIMITER ;


-- 3. FUNCTION: Calculate Grower Revenue

DELIMITER $$


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
    INNER JOIN `Order` o ON oi.OrderID = o.OrderID
    WHERE p.GrowerID = p_grower_id
    AND o.OrderDate BETWEEN p_start_date AND p_end_date
    AND o.Status IN ('confirmed', 'delivered');

    RETURN v_total_revenue;
END$$

DELIMITER ;


-- 4. COMPLEX QUERY: Grower Performance Dashboard
-- This query provides comprehensive performance metrics for all growers
-- including: total products, total plots, total revenue, average order value,
-- active recommendations, and success rate

-- Note: This is a complex query for reference and reporting purposes.
-- Can be used in backend to fetch grower analytics:
/*
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
    
    -- Customer Satisfaction (based on completed orders)
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
LEFT JOIN `Order` o ON oi.OrderID = o.OrderID
LEFT JOIN HarvestBatch hb ON pr.ProductID = hb.ProductID
LEFT JOIN Recommendation r ON g.GrowerID = r.GrowerID OR pr.ProductID = r.ProductID
GROUP BY g.GrowerID, g.Name, g.ContactNo, g.Address
ORDER BY TotalRevenue DESC, TotalOrders DESC;
*/
