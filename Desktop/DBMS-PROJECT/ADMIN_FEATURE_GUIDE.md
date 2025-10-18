# 👨‍💼 Admin Dashboard - Complete Guide

## Overview
The Admin Dashboard is a comprehensive management system that provides complete control over all database tables. Admins can view, edit, and manage all aspects of the Urban Farming System.

---

## 🔐 Admin Login

### Credentials
- **Username**: `admin`
- **Password**: `admin123`

### Steps to Login
1. Click on the **👨‍💼 Admin** button on the login page
2. Enter the username: `admin`
3. Enter the password: `admin123`
4. Click **Login as Admin**

---

## 📊 Admin Dashboard Features

### 1. **🌱 Growers Tab**
Manage all grower information in the system.

**Visible Columns:**
- GrowerID
- Name
- ContactNo
- Address
- CreatedAt

**Edit Capabilities:**
- Name
- ContactNo
- Address

**Use Cases:**
- Update grower contact information
- Correct grower addresses
- Manage grower details

---

### 2. **📦 Products Tab**
Manage all products offered by growers.

**Visible Columns:**
- ProductID
- Name
- Category
- PricePerUnit
- GrowerID
- GrowerName
- CreatedAt

**Edit Capabilities:**
- Name
- Category
- PricePerUnit

**Use Cases:**
- Update product prices
- Correct product categories
- Modify product names
- Adjust pricing strategy

---

### 3. **📋 Orders Tab**
Monitor and manage all customer orders.

**Visible Columns:**
- OrderID
- OrderDate
- CustomerID
- CustomerName
- Email
- TotalAmount
- Status
- CreatedAt

**Edit Capabilities:**
- Status (pending, confirmed, delivered, cancelled)

**Use Cases:**
- Track order progress
- Update order status
- Monitor order timeline
- Manage customer communications

---

### 4. **👥 Customers Tab**
Manage all customer accounts and information.

**Visible Columns:**
- CustomerID
- Name
- Email
- ContactNo
- Address
- CreatedAt

**Edit Capabilities:**
- Name
- Email
- ContactNo
- Address

**Use Cases:**
- Update customer details
- Manage customer addresses
- Correct contact information
- Handle customer account updates

---

### 5. **💳 Payments Tab**
Monitor all payment transactions in the system.

**Visible Columns:**
- PaymentID
- Mode (Card, UPI, Bank Transfer, Cash)
- Status
- OrderID
- Amount
- CreatedAt

**Edit Capabilities:**
- View only (read-only mode)

**Use Cases:**
- Track payment methods
- Verify payment amounts
- Monitor payment status
- Generate payment reports

---

### 6. **💡 Recommendations Tab**
View all farming recommendations provided by growers.

**Visible Columns:**
- RecommendationID
- TownName
- ClimateType
- Season
- RecommendedCrop
- Benefits
- ExpectedYield
- SoilType
- GrowerName
- ProductName

**Edit Capabilities:**
- View only (read-only mode)

**Use Cases:**
- Review all recommendations
- Verify recommendation quality
- Monitor knowledge sharing
- Ensure data consistency

---

### 7. **🌾 Harvest Batches Tab**
Manage inventory and harvest batch information.

**Visible Columns:**
- ProductID
- BatchNo
- HarvestDate
- ExpiryDate
- QuantityAvailable
- ProductName
- CreatedAt

**Edit Capabilities:**
- View only (read-only mode)

**Use Cases:**
- Track inventory levels
- Monitor batch expiry dates
- Verify harvest information
- Manage stock quantities

---

## 🎯 How to Edit Records

### Steps:
1. Navigate to the desired tab
2. Click the **Edit** button on the row you want to modify
3. The row will highlight in yellow showing edit mode
4. Modify the editable fields (input boxes will appear)
5. Click **Save** to confirm changes
6. Click **Cancel** to discard changes

### Important Notes:
- Only certain columns are editable based on business logic
- Some tables (Payments, Recommendations, Harvest Batches) are read-only
- Changes are immediately saved to the database
- The table will refresh automatically after successful edits

---

## 📈 Key Statistics

### Record Counts
- Each tab displays the total number of records in the top-right corner
- Helps monitor system data volume
- Updates automatically when records are added/removed

### Navigation
- Use tabs to switch between different sections
- Tabs display icons for easy identification
- Active tab is highlighted in blue

---

## 🔄 Data Management Workflows

### Scenario 1: Update Product Pricing
1. Go to **📦 Products** tab
2. Find the product to update
3. Click **Edit**
4. Update the **PricePerUnit** field
5. Click **Save**

### Scenario 2: Track Order Progress
1. Go to **📋 Orders** tab
2. Find the order to update
3. Click **Edit**
4. Change **Status** to: pending → confirmed → delivered
5. Click **Save**

### Scenario 3: Correct Customer Information
1. Go to **👥 Customers** tab
2. Find the customer record
3. Click **Edit**
4. Update Name, Email, ContactNo, or Address
5. Click **Save**

### Scenario 4: Monitor Payments
1. Go to **💳 Payments** tab
2. Review payment modes and amounts
3. Verify payment status for each order
4. View historical payment data

---

## ⚠️ Important Considerations

### Data Validation
- Email addresses should be unique
- Prices should be positive numbers
- Dates should be valid dates
- All required fields must have values

### Access Control
- Only authenticated admins can access this dashboard
- Each admin session expires after 7 days
- Token is stored securely in browser localStorage

### Audit Trail
- All changes are persisted to the database
- CreatedAt and UpdatedAt timestamps track modifications
- Consider implementing audit logging for production use

---

## 🚨 Troubleshooting

### Issue: Cannot Login as Admin
**Solution:** 
- Verify username is exactly `admin` (case-sensitive)
- Verify password is exactly `admin123`
- Check if backend server is running on port 5011
- Clear browser cache and try again

### Issue: Edit Button Not Working
**Solution:**
- Ensure token is valid (login again if needed)
- Check browser console for error messages
- Verify backend API is accessible

### Issue: Data Not Updating
**Solution:**
- Click Save button (not just leaving edit mode)
- Check for validation errors in console
- Verify all required fields are filled
- Refresh page to see latest data

### Issue: Read-Only Tabs
**Solution:**
- Some tabs like Payments and Recommendations are intentionally read-only
- This is to prevent accidental modifications
- Contact system administrator if you need to modify these

---

## 🔒 Security Best Practices

1. **Change Default Credentials** (in production)
   - Update admin username and password in `backend/server.js`
   - Never use default credentials in production

2. **Session Management**
   - Log out after each session
   - Don't share login credentials
   - Use different passwords for different systems

3. **Data Protection**
   - Sensitive data like customer emails are visible
   - Ensure admin computers are secure
   - Use HTTPS in production

4. **Backup Strategy**
   - Regular database backups
   - Test backup restoration
   - Keep audit logs

---

## 📱 Responsive Design

The Admin Dashboard is fully responsive and works on:
- Desktop (1920x1080 and above)
- Tablet (768px and above)
- Mobile (360px and above)

### Tips for Mobile:
- Tables are scrollable horizontally
- Use portrait orientation for better view
- Edit mode makes fields easier to tap

---

## 🎨 UI Features

### Visual Indicators
- **Blue Background**: Active tab
- **Yellow Background**: Row in edit mode
- **Green Banner**: Success message
- **Red Banner**: Error message

### Interactive Elements
- Buttons change color on hover
- Smooth animations on transitions
- Loading states for operations
- Success/error notifications

---

## 📞 Support

### For Issues or Questions:
1. Check this guide first
2. Review error messages in browser console
3. Verify backend API is running
4. Check database connection
5. Review error logs

---

## 🔄 API Endpoints Used

**Base URL**: `http://localhost:5011/api`

### Admin Endpoints:
- `GET /admin/growers` - Get all growers
- `PUT /admin/growers/:id` - Update grower
- `GET /admin/products` - Get all products
- `PUT /admin/products/:id` - Update product
- `GET /admin/orders` - Get all orders
- `PUT /admin/orders/:id` - Update order
- `GET /admin/customers` - Get all customers
- `PUT /admin/customers/:id` - Update customer
- `GET /admin/payments` - Get all payments
- `GET /admin/recommendations` - Get all recommendations
- `GET /admin/harvest-batches` - Get all harvest batches

---

**Last Updated**: October 2025  
**Version**: 1.0  
**Status**: Production Ready ✅