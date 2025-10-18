# Database Objects Integration Guide

This guide explains how to use the new database objects (triggers, procedures, functions, and complex queries) integrated into your Urban Farming Management System.

## Table of Contents
1. [Overview](#overview)
2. [Database Objects](#database-objects)
3. [API Endpoints](#api-endpoints)
4. [Usage Examples](#usage-examples)
5. [Features](#features)

---

## Overview

The following database objects have been added to enhance your system:

- **3 Triggers** - Auto-calculate order totals
- **1 Stored Procedure** - Process complete orders
- **1 Function** - Calculate grower revenue
- **1 Complex Query** - Grower performance dashboard

All these are now accessible through new REST API endpoints.

---

## Database Objects

### 1. Triggers (Auto-calculate Order Total)

**Location:** `schema.sql` (lines 173-215)

**What they do:**
- `trg_update_order_total_insert` - Updates order total when items are added
- `trg_update_order_total_update` - Updates order total when items are modified
- `trg_update_order_total_delete` - Updates order total when items are removed

**How they work:**
These triggers automatically calculate the `TotalAmount` in the `Order` table by summing all `Subtotal` values from `OrderItem`. You don't need to manually calculate totals!

---

### 2. Stored Procedure: `sp_process_order`

**Location:** `schema.sql` (lines 229-310)

**Parameters:**
- `p_customer_id` (INT) - Customer ID
- `p_order_date` (DATE) - Order date
- `p_payment_mode` (ENUM) - Payment method: 'cash', 'card', 'upi', 'bank_transfer'
- `p_product_id` (INT) - Product ID
- `p_quantity` (DECIMAL) - Quantity to order
- `@p_order_id` (OUT INT) - Returned order ID
- `@p_message` (OUT VARCHAR) - Returned status message

**What it does:**
1. Validates product exists
2. Checks inventory availability (from HarvestBatch)
3. Checks product hasn't expired
4. Creates order
5. Adds order items
6. Updates harvest batch quantities
7. Creates payment record
8. All within a transaction (rollback on error)

**Manual SQL Example:**
```sql
CALL sp_process_order(
    1,                    -- Customer ID
    '2024-01-15',        -- Order Date
    'card',              -- Payment Mode
    1,                   -- Product ID
    10.0,                -- Quantity
    @order_id,           -- Output: Order ID
    @message             -- Output: Message
);
SELECT @order_id, @message;
```

---

### 3. Function: `fn_calculate_grower_revenue`

**Location:** `schema.sql` (lines 321-343)

**Parameters:**
- `p_grower_id` (INT) - Grower ID
- `p_start_date` (DATE) - Start date
- `p_end_date` (DATE) - End date

**Returns:** DECIMAL(10,2) - Total revenue

**What it does:**
Calculates total revenue for a grower by summing all order item subtotals from confirmed or delivered orders within the specified date range.

**Manual SQL Example:**
```sql
SELECT fn_calculate_grower_revenue(1, '2024-01-01', '2024-12-31') AS TotalRevenue;
```

---

### 4. Complex Query: Grower Performance Dashboard

**Location:** `schema.sql` (lines 354-426) [Commented SQL]

**What it provides:**
Comprehensive analytics for each grower including:
- Plot statistics (total, size, soil types)
- Product statistics (count, categories)
- Revenue statistics (total, count, average)
- Harvest statistics (available quantity, active batches)
- Recommendation statistics
- Delivery success rate
- Customer satisfaction metrics
- Recent activity timestamps

---

## API Endpoints

### 1. Process Complete Order (Using Stored Procedure)

**Endpoint:** `POST /api/orders/process-complete`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerID": 1,
  "orderDate": "2024-01-15",
  "paymentMode": "card",
  "productID": 1,
  "quantity": 10.0
}
```

**Response (Success):**
```json
{
  "success": true,
  "orderID": 5,
  "message": "Order #5 processed successfully",
  "data": [...]
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Insufficient stock or product expired"
}
```

---

### 2. Get Grower Revenue (Using Function)

**Endpoint:** `GET /api/growers/:id/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `startDate` (required) - Start date in YYYY-MM-DD format
- `endDate` (required) - End date in YYYY-MM-DD format

**Example Request:**
```
GET /api/growers/1/revenue?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "growerID": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "totalRevenue": 5250.50
}
```

---

### 3. Get Grower Performance Dashboard (Using Complex Query)

**Endpoint:** `GET /api/growers/dashboard/performance`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "GrowerID": 1,
      "GrowerName": "John Smith",
      "ContactNo": "9876543210",
      "Address": "123 Farm Road, Green Valley, State 12345",
      "TotalPlots": 2,
      "TotalPlotSize": 4.30,
      "SoilTypes": "Loamy, Sandy",
      "TotalProducts": 2,
      "ProductCategories": "Vegetables, Leafy Greens",
      "TotalRevenue": 5250.50,
      "TotalOrders": 15,
      "AverageOrderValue": 350.00,
      "TotalAvailableQuantity": 150.00,
      "ActiveBatches": 5,
      "TotalRecommendations": 1,
      "RecommendedCrops": "Tomatoes",
      "DeliverySuccessRate": 93.33,
      "SatisfiedCustomers": 14,
      "LastOrderDate": "2024-01-15",
      "LastProductAdded": "2024-01-10 10:30:00"
    },
    ...more growers
  ]
}
```

---

### 4. Get Single Grower Performance

**Endpoint:** `GET /api/growers/:id/performance`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "GrowerID": 1,
    "GrowerName": "John Smith",
    "ContactNo": "9876543210",
    "Address": "123 Farm Road, Green Valley, State 12345",
    "TotalPlots": 2,
    "TotalPlotSize": 4.30,
    "TotalProducts": 2,
    "TotalRevenue": 5250.50,
    "TotalOrders": 15,
    "DeliverySuccessRate": 93.33
  }
}
```

---

### 5. Test Triggers (Verify They Work)

**Endpoint:** `POST /api/database/test-triggers`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "message": "Triggers are working correctly",
  "data": {
    "orderID": 10,
    "totalAmount": 225.00,
    "note": "Order total was auto-calculated by trigger"
  }
}
```

---

## Usage Examples

### Example 1: Process a Complete Order

```javascript
// Frontend - JavaScript/React
const token = localStorage.getItem('token');

const orderData = {
  customerID: 1,
  orderDate: new Date().toISOString().split('T')[0],
  paymentMode: 'card',
  productID: 1,
  quantity: 5.0
};

const response = await fetch('http://localhost:5011/api/orders/process-complete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});

const result = await response.json();
if (result.success) {
  console.log(`Order #${result.orderID} created successfully!`);
} else {
  console.error(result.message);
}
```

### Example 2: Get Grower Revenue Report

```javascript
const token = localStorage.getItem('token');
const growerID = 1;
const startDate = '2024-01-01';
const endDate = '2024-12-31';

const response = await fetch(
  `http://localhost:5011/api/growers/${growerID}/revenue?startDate=${startDate}&endDate=${endDate}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const result = await response.json();
console.log(`Total Revenue: ₹${result.totalRevenue}`);
```

### Example 3: Fetch All Grower Performance Metrics

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5011/api/growers/dashboard/performance', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const result = await response.json();
const growers = result.data;

growers.forEach(grower => {
  console.log(`
    ${grower.GrowerName}
    Revenue: ₹${grower.TotalRevenue}
    Orders: ${grower.TotalOrders}
    Success Rate: ${grower.DeliverySuccessRate}%
  `);
});
```

### Example 4: Add Custom Harvest Batch (For Testing Triggers)

```sql
-- Add a harvest batch for testing
INSERT INTO HarvestBatch (ProductID, BatchNo, HarvestDate, ExpiryDate, QuantityAvailable)
VALUES (1, 'BATCH-001', '2024-01-10', '2024-02-10', 500.00);

-- Now when you add order items, the trigger will auto-update the order total
```

---

## Features

### ✅ Automatic Order Total Calculation
The triggers ensure that whenever order items are added, updated, or removed, the order total is automatically recalculated. No manual calculation needed!

### ✅ Complete Order Processing
The stored procedure `sp_process_order` handles:
- Inventory validation
- Expiry date checking
- Transaction management
- Error handling with rollback
- Payment record creation

All in a single atomic operation!

### ✅ Revenue Analytics
The `fn_calculate_grower_revenue` function provides quick revenue calculations for:
- Revenue reports
- Financial dashboards
- Performance comparisons

### ✅ Performance Dashboard
The complex query provides:
- Overall grower statistics
- Customer satisfaction metrics
- Delivery success rates
- Recent activity tracking
- Available inventory status

### ✅ Error Handling
All endpoints include proper error handling and validation:
- Input validation
- Database error catching
- Meaningful error messages
- HTTP status codes

---

## Integration Summary

| Component | Type | Usage |
|-----------|------|-------|
| `trg_update_order_total_*` | Triggers (3) | Automatic - no action needed |
| `sp_process_order` | Procedure | `/api/orders/process-complete` |
| `fn_calculate_grower_revenue` | Function | `/api/growers/:id/revenue` |
| Complex Query | Query | `/api/growers/dashboard/performance` |

---

## Next Steps

1. **Update Frontend** - Create UI components for:
   - Order processing form
   - Revenue report dashboard
   - Grower performance analytics

2. **Add More Analytics** - Consider adding:
   - Monthly revenue trends
   - Product popularity reports
   - Customer purchase patterns

3. **Optimize Queries** - Add indexes for:
   - Frequently filtered columns
   - Join columns for better performance

4. **Monitor Performance** - Use:
   - Database query logs
   - Performance monitoring tools
   - API response time tracking

---

## Troubleshooting

### Triggers Not Working
- Ensure schema.sql has been executed
- Check that `DELIMITER` commands are correct
- Verify triggers exist: `SHOW TRIGGERS;`

### Procedure Not Found
- Run `schema.sql` again
- Check MySQL error logs
- Verify syntax is correct

### Function Returns Wrong Values
- Check that ORDER status is 'confirmed' or 'delivered'
- Verify date format is YYYY-MM-DD
- Ensure data exists in the date range

---

For more information, see the commented queries in `schema.sql`.