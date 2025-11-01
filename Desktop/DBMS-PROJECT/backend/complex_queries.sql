WITH product_stats AS (
    SELECT
        GrowerID,
        COUNT(DISTINCT ProductID) AS total_products
    FROM Product
    GROUP BY GrowerID
),
plot_stats AS (
    SELECT
        GrowerID,
        COUNT(*) AS total_plots,
        SUM(Size) AS total_plot_size
    FROM Plot
    GROUP BY GrowerID
),
order_values AS (
    SELECT
        p.GrowerID,
        o.OrderID,
        o.Status,
        SUM(oi.Subtotal) AS order_revenue
    FROM Product p
    JOIN OrderItem oi ON oi.ProductID = p.ProductID
    JOIN `Order` o ON o.OrderID = oi.OrderID
    GROUP BY p.GrowerID, o.OrderID, o.Status
),
revenue_stats AS (
    SELECT
        GrowerID,
        COUNT(CASE WHEN Status IN ('confirmed', 'delivered') THEN OrderID END) AS fulfilled_orders,
        SUM(CASE WHEN Status IN ('confirmed', 'delivered') THEN order_revenue ELSE 0 END) AS total_revenue,
        AVG(CASE WHEN Status IN ('confirmed', 'delivered') THEN order_revenue END) AS avg_order_value
    FROM order_values
    GROUP BY GrowerID
)
SELECT
    g.GrowerID,
    g.Name AS GrowerName,
    COALESCE(ps.total_plots, 0) AS TotalPlots,
    COALESCE(ps.total_plot_size, 0) AS TotalPlotSize,
    COALESCE(pr.total_products, 0) AS TotalProducts,
    COALESCE(rs.fulfilled_orders, 0) AS FulfilledOrders,
    COALESCE(rs.total_revenue, 0) AS TotalRevenue,
    COALESCE(rs.avg_order_value, 0) AS AverageOrderValue,
    ROW_NUMBER() OVER (ORDER BY COALESCE(rs.total_revenue, 0) DESC) AS RevenueRank
FROM Grower g
LEFT JOIN plot_stats ps ON ps.GrowerID = g.GrowerID
LEFT JOIN product_stats pr ON pr.GrowerID = g.GrowerID
LEFT JOIN revenue_stats rs ON rs.GrowerID = g.GrowerID
ORDER BY RevenueRank;

WITH monthly_category_sales AS (
    SELECT
        DATE_FORMAT(o.OrderDate, '%Y-%m-01') AS month_start,
        p.Category,
        SUM(oi.Subtotal) AS category_revenue
    FROM OrderItem oi
    JOIN `Order` o ON o.OrderID = oi.OrderID
    JOIN Product p ON p.ProductID = oi.ProductID
    WHERE o.Status IN ('confirmed', 'delivered')
    GROUP BY DATE_FORMAT(o.OrderDate, '%Y-%m-01'), p.Category
)
SELECT
    STR_TO_DATE(month_start, '%Y-%m-%d') AS month_start,
    Category,
    category_revenue,
    ROUND(category_revenue / NULLIF(SUM(category_revenue) OVER (PARTITION BY month_start), 0) * 100, 2) AS month_revenue_share_pct,
    ROUND(SUM(category_revenue) OVER (PARTITION BY Category ORDER BY STR_TO_DATE(month_start, '%Y-%m-%d') ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS category_running_total
FROM monthly_category_sales
ORDER BY STR_TO_DATE(month_start, '%Y-%m-%d'), category_revenue DESC;

WITH ordered_customers AS (
    SELECT
        o.CustomerID,
        o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        DATEDIFF(o.OrderDate, LAG(o.OrderDate) OVER (PARTITION BY o.CustomerID ORDER BY o.OrderDate)) AS days_between_orders
    FROM `Order` o
    WHERE o.Status IN ('confirmed', 'delivered')
),
customer_stats AS (
    SELECT
        CustomerID,
        COUNT(*) AS completed_orders,
        MIN(OrderDate) AS first_order_date,
        MAX(OrderDate) AS last_order_date,
        SUM(TotalAmount) AS total_spent,
        AVG(days_between_orders) AS avg_days_between_orders
    FROM ordered_customers
    GROUP BY CustomerID
)
SELECT
    cs.CustomerID,
    c.Name,
    cs.completed_orders,
    cs.first_order_date,
    cs.last_order_date,
    ROUND(cs.total_spent, 2) AS total_spent,
    ROUND(cs.avg_days_between_orders, 2) AS avg_days_between_orders
FROM customer_stats cs
JOIN Customer c ON c.CustomerID = cs.CustomerID
WHERE cs.completed_orders > 1
ORDER BY cs.total_spent DESC;

WITH product_sales_30d AS (
    SELECT
        oi.ProductID,
        SUM(oi.Quantity) AS sold_qty_30d
    FROM OrderItem oi
    JOIN `Order` o ON o.OrderID = oi.OrderID
    WHERE o.Status IN ('confirmed', 'delivered')
      AND o.OrderDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY oi.ProductID
),
batch_status AS (
    SELECT
        hb.ProductID,
        hb.BatchNo,
        hb.QuantityAvailable,
        hb.HarvestDate,
        hb.ExpiryDate,
        DATEDIFF(hb.ExpiryDate, CURDATE()) AS days_to_expiry,
        COALESCE(ps.sold_qty_30d, 0) AS sold_qty_30d,
        COALESCE(ps.sold_qty_30d, 0) / 30 AS avg_daily_sold
    FROM HarvestBatch hb
    LEFT JOIN product_sales_30d ps ON ps.ProductID = hb.ProductID
)
SELECT
    bs.ProductID,
    p.Name AS ProductName,
    g.Name AS GrowerName,
    bs.BatchNo,
    bs.QuantityAvailable,
    bs.days_to_expiry,
    ROUND(bs.avg_daily_sold, 2) AS avg_daily_sold,
    CASE
        WHEN bs.avg_daily_sold > 0 THEN ROUND(bs.QuantityAvailable / bs.avg_daily_sold, 2)
        ELSE NULL
    END AS days_of_stock_remaining
FROM batch_status bs
JOIN Product p ON p.ProductID = bs.ProductID
JOIN Grower g ON g.GrowerID = p.GrowerID
WHERE (bs.days_to_expiry BETWEEN 0 AND 14)
   OR (bs.avg_daily_sold > 0 AND bs.QuantityAvailable < bs.avg_daily_sold * 7)
ORDER BY bs.days_to_expiry ASC, bs.QuantityAvailable ASC;

WITH recommendation_orders AS (
    SELECT
        r.RecommendationID,
        r.TownName,
        r.RecommendedCrop,
        r.GrowerID,
        COALESCE(SUM(CASE WHEN o.Status IN ('confirmed', 'delivered') THEN oi.Subtotal ELSE 0 END), 0) AS revenue_generated,
        COUNT(DISTINCT CASE WHEN o.Status IN ('confirmed', 'delivered') THEN o.OrderID END) AS fulfilled_orders,
        COUNT(DISTINCT CASE WHEN o.Status IN ('pending', 'confirmed') THEN o.OrderID END) AS active_orders
    FROM Recommendation r
    LEFT JOIN Product p ON p.ProductID = r.ProductID
    LEFT JOIN OrderItem oi ON oi.ProductID = p.ProductID
    LEFT JOIN `Order` o ON o.OrderID = oi.OrderID
    GROUP BY r.RecommendationID, r.TownName, r.RecommendedCrop, r.GrowerID
),
ranked_recommendations AS (
    SELECT
        ro.*,
        ROW_NUMBER() OVER (PARTITION BY ro.GrowerID ORDER BY ro.revenue_generated DESC, ro.fulfilled_orders DESC) AS revenue_rank
    FROM recommendation_orders ro
)
SELECT
    rr.RecommendationID,
    rr.GrowerID,
    g.Name AS GrowerName,
    rr.TownName,
    rr.RecommendedCrop,
    rr.revenue_generated,
    rr.fulfilled_orders,
    rr.active_orders,
    rr.revenue_rank
FROM ranked_recommendations rr
LEFT JOIN Grower g ON g.GrowerID = rr.GrowerID
WHERE rr.revenue_rank <= 3
ORDER BY rr.GrowerID, rr.revenue_rank;

-- Example: Grower metrics for GrowerID 1
WITH product_stats AS (
    SELECT
        GrowerID,
        COUNT(DISTINCT ProductID) AS total_products
    FROM Product
    GROUP BY GrowerID
),
plot_stats AS (
    SELECT
        GrowerID,
        COUNT(*) AS total_plots,
        SUM(Size) AS total_plot_size
    FROM Plot
    GROUP BY GrowerID
),
order_values AS (
    SELECT
        p.GrowerID,
        o.OrderID,
        o.Status,
        SUM(oi.Subtotal) AS order_revenue
    FROM Product p
    JOIN OrderItem oi ON oi.ProductID = p.ProductID
    JOIN `Order` o ON o.OrderID = oi.OrderID
    GROUP BY p.GrowerID, o.OrderID, o.Status
),
revenue_stats AS (
    SELECT
        GrowerID,
        COUNT(CASE WHEN Status IN ('confirmed', 'delivered') THEN OrderID END) AS fulfilled_orders,
        SUM(CASE WHEN Status IN ('confirmed', 'delivered') THEN order_revenue ELSE 0 END) AS total_revenue,
        AVG(CASE WHEN Status IN ('confirmed', 'delivered') THEN order_revenue END) AS avg_order_value
    FROM order_values
    GROUP BY GrowerID
)
SELECT
    g.GrowerID,
    g.Name AS GrowerName,
    COALESCE(ps.total_plots, 0) AS TotalPlots,
    COALESCE(ps.total_plot_size, 0) AS TotalPlotSize,
    COALESCE(pr.total_products, 0) AS TotalProducts,
    COALESCE(rs.fulfilled_orders, 0) AS FulfilledOrders,
    COALESCE(rs.total_revenue, 0) AS TotalRevenue,
    COALESCE(rs.avg_order_value, 0) AS AverageOrderValue,
    ROW_NUMBER() OVER (ORDER BY COALESCE(rs.total_revenue, 0) DESC) AS RevenueRank
FROM Grower g
LEFT JOIN plot_stats ps ON ps.GrowerID = g.GrowerID
LEFT JOIN product_stats pr ON pr.GrowerID = g.GrowerID
LEFT JOIN revenue_stats rs ON rs.GrowerID = g.GrowerID
WHERE g.GrowerID = 1
ORDER BY RevenueRank;

-- Example: Monthly revenue share for Vegetables in January 2024
WITH monthly_category_sales AS (
    SELECT
        DATE_FORMAT(o.OrderDate, '%Y-%m-01') AS month_start,
        p.Category,
        SUM(oi.Subtotal) AS category_revenue
    FROM OrderItem oi
    JOIN `Order` o ON o.OrderID = oi.OrderID
    JOIN Product p ON p.ProductID = oi.ProductID
    WHERE o.Status IN ('confirmed', 'delivered')
    GROUP BY DATE_FORMAT(o.OrderDate, '%Y-%m-01'), p.Category
)
SELECT
    STR_TO_DATE(month_start, '%Y-%m-%d') AS month_start,
    Category,
    category_revenue,
    ROUND(category_revenue / NULLIF(SUM(category_revenue) OVER (PARTITION BY month_start), 0) * 100, 2) AS month_revenue_share_pct,
    ROUND(SUM(category_revenue) OVER (PARTITION BY Category ORDER BY STR_TO_DATE(month_start, '%Y-%m-%d') ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS category_running_total
FROM monthly_category_sales
WHERE month_start = '2024-01-01'
  AND Category = 'Vegetables'
ORDER BY STR_TO_DATE(month_start, '%Y-%m-%d'), category_revenue DESC;

-- Example: Returning customers with more than one order focusing on CustomerID 1
WITH ordered_customers AS (
    SELECT
        o.CustomerID,
        o.OrderID,
        o.OrderDate,
        o.TotalAmount,
        DATEDIFF(o.OrderDate, LAG(o.OrderDate) OVER (PARTITION BY o.CustomerID ORDER BY o.OrderDate)) AS days_between_orders
    FROM `Order` o
    WHERE o.Status IN ('confirmed', 'delivered')
),
customer_stats AS (
    SELECT
        CustomerID,
        COUNT(*) AS completed_orders,
        MIN(OrderDate) AS first_order_date,
        MAX(OrderDate) AS last_order_date,
        SUM(TotalAmount) AS total_spent,
        AVG(days_between_orders) AS avg_days_between_orders
    FROM ordered_customers
    GROUP BY CustomerID
)
SELECT
    cs.CustomerID,
    c.Name,
    cs.completed_orders,
    cs.first_order_date,
    cs.last_order_date,
    ROUND(cs.total_spent, 2) AS total_spent,
    ROUND(cs.avg_days_between_orders, 2) AS avg_days_between_orders
FROM customer_stats cs
JOIN Customer c ON c.CustomerID = cs.CustomerID
WHERE cs.completed_orders > 1
  AND cs.CustomerID = 1
ORDER BY cs.total_spent DESC;

-- Example: Identify batches for ProductID 1 nearing expiry
WITH product_sales_30d AS (
    SELECT
        oi.ProductID,
        SUM(oi.Quantity) AS sold_qty_30d
    FROM OrderItem oi
    JOIN `Order` o ON o.OrderID = oi.OrderID
    WHERE o.Status IN ('confirmed', 'delivered')
      AND o.OrderDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY oi.ProductID
),
batch_status AS (
    SELECT
        hb.ProductID,
        hb.BatchNo,
        hb.QuantityAvailable,
        hb.HarvestDate,
        hb.ExpiryDate,
        DATEDIFF(hb.ExpiryDate, CURDATE()) AS days_to_expiry,
        COALESCE(ps.sold_qty_30d, 0) AS sold_qty_30d,
        COALESCE(ps.sold_qty_30d, 0) / 30 AS avg_daily_sold
    FROM HarvestBatch hb
    LEFT JOIN product_sales_30d ps ON ps.ProductID = hb.ProductID
)
SELECT
    bs.ProductID,
    p.Name AS ProductName,
    g.Name AS GrowerName,
    bs.BatchNo,
    bs.QuantityAvailable,
    bs.days_to_expiry,
    ROUND(bs.avg_daily_sold, 2) AS avg_daily_sold,
    CASE
        WHEN bs.avg_daily_sold > 0 THEN ROUND(bs.QuantityAvailable / bs.avg_daily_sold, 2)
        ELSE NULL
    END AS days_of_stock_remaining
FROM batch_status bs
JOIN Product p ON p.ProductID = bs.ProductID
JOIN Grower g ON g.GrowerID = p.GrowerID
WHERE ((bs.days_to_expiry BETWEEN 0 AND 14)
   OR (bs.avg_daily_sold > 0 AND bs.QuantityAvailable < bs.avg_daily_sold * 7))
  AND bs.ProductID = 1
ORDER BY bs.days_to_expiry ASC, bs.QuantityAvailable ASC;

-- Example: Top recommendation performance for GrowerID 1
WITH recommendation_orders AS (
    SELECT
        r.RecommendationID,
        r.TownName,
        r.RecommendedCrop,
        r.GrowerID,
        COALESCE(SUM(CASE WHEN o.Status IN ('confirmed', 'delivered') THEN oi.Subtotal ELSE 0 END), 0) AS revenue_generated,
        COUNT(DISTINCT CASE WHEN o.Status IN ('confirmed', 'delivered') THEN o.OrderID END) AS fulfilled_orders,
        COUNT(DISTINCT CASE WHEN o.Status IN ('pending', 'confirmed') THEN o.OrderID END) AS active_orders
    FROM Recommendation r
    LEFT JOIN Product p ON p.ProductID = r.ProductID
    LEFT JOIN OrderItem oi ON oi.ProductID = p.ProductID
    LEFT JOIN `Order` o ON o.OrderID = oi.OrderID
    GROUP BY r.RecommendationID, r.TownName, r.RecommendedCrop, r.GrowerID
),
ranked_recommendations AS (
    SELECT
        ro.*,
        ROW_NUMBER() OVER (PARTITION BY ro.GrowerID ORDER BY ro.revenue_generated DESC, ro.fulfilled_orders DESC) AS revenue_rank
    FROM recommendation_orders ro
)
SELECT
    rr.RecommendationID,
    rr.GrowerID,
    g.Name AS GrowerName,
    rr.TownName,
    rr.RecommendedCrop,
    rr.revenue_generated,
    rr.fulfilled_orders,
    rr.active_orders,
    rr.revenue_rank
FROM ranked_recommendations rr
LEFT JOIN Grower g ON g.GrowerID = rr.GrowerID
WHERE rr.revenue_rank <= 3
  AND rr.GrowerID = 1
ORDER BY rr.GrowerID, rr.revenue_rank;
