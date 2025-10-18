# Urban Farming Management System - Setup Instructions

## Overview
This is a complete full-stack application with:
- **Backend**: Node.js/Express API with MySQL database
- **Frontend**: React application with routing and authentication
- **Database**: Urban Farming schema with Grower, Customer, Product, Order management

## Prerequisites
- Node.js (v14+) and npm installed
- MySQL server running
- Terminal/Command Prompt access

---

## Step 1: Database Setup

### Create and Initialize Database
1. Open MySQL command line or MySQL Workbench
2. Run the schema file:
```sql
SOURCE /Users/saiabhinav/Desktop/DBMS\ PROJECT/backend/schema.sql;
```

This will:
- Create `urban_farming` database
- Create all necessary tables
- Insert sample data for growers and customers

---

## Step 2: Backend Setup

### Install Dependencies
```bash
cd /Users/saiabhinav/Desktop/DBMS\ PROJECT/backend
npm install
```

### Configure Environment Variables
The `.env` file is already created. Update it if needed:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<your_mysql_password>
DB_NAME=urban_farming
JWT_SECRET=your_jwt_secret_key_change_this
```

### Start Backend Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server should be running at: `http://localhost:5000`

---

## Step 3: Frontend Setup

### Install Dependencies
```bash
cd /Users/saiabhinav/Desktop/DBMS\ PROJECT/frontend
npm install
```

### Start Frontend Application
```bash
npm start
```

React app will open automatically at: `http://localhost:3000`

---

## Login Credentials

### Grower Login (Demo)
- **Grower ID**: 1
- **Name**: John Smith

OR

- **Grower ID**: 2
- **Name**: Maria Garcia

OR

- **Grower ID**: 3
- **Name**: David Johnson

### Customer Login/Register
- Use the Register button to create a new customer account
- Or manually add a customer to test:

```sql
INSERT INTO Customer (Name, Email, ContactNo, Address, PasswordHash) 
VALUES ('Test Customer', 'test@example.com', '9876543210', '123 Test Street', 
'$2a$10$9K8x6h8y7z6a5b4c3d2e1f0g9h8i7j6k5l4m3n2o1p0q9r8s7t6u5v4w');
-- Password: test123
```

---

## Application Features

### 🌱 For Growers
1. **View Profile**: See grower details and associated plots
2. **Manage Products**:
   - Add new products (vegetables, fruits, etc.)
   - Set pricing
   - Track harvest batches
3. **Provide Recommendations**:
   - Add crop recommendations by town/season/soil type
   - Include farming practices and expected yields
   - Help other growers with best practices

### 🛒 For Customers
1. **Browse Products**: See all available products from different growers
2. **Shopping Cart**: 
   - Add products to cart
   - Update quantities
   - Remove items
3. **Checkout & Payment**:
   - Support for multiple payment methods:
     - Credit/Debit Card
     - UPI
     - Bank Transfer
     - Cash
4. **Order Management**:
   - View order history
   - Track order status (pending → confirmed → delivered)
   - See payment details

---

## API Endpoints

### Authentication
- `POST /api/auth/grower-login` - Grower login
- `POST /api/auth/customer-login` - Customer login
- `POST /api/auth/customer-register` - Customer registration

### Grower APIs
- `GET /api/growers/:id` - Get grower details
- `GET /api/growers/:id/plots` - Get grower's plots
- `GET /api/growers/:id/products` - Get grower's products

### Product APIs
- `GET /api/products` - Get all products
- `POST /api/products` - Add new product (grower)
- `POST /api/harvest-batch` - Add harvest batch

### Order APIs
- `POST /api/orders` - Create order
- `GET /api/customers/:id/orders` - Get customer orders
- `GET /api/orders/:id/items` - Get order items

### Payment APIs
- `POST /api/payments` - Create payment
- `GET /api/orders/:id/payment` - Get order payment

### Recommendation APIs
- `GET /api/recommendations` - Get recommendations (with filters)
- `POST /api/recommendations` - Add recommendation (grower)

---

## Project Structure

```
/Users/saiabhinav/Desktop/DBMS PROJECT/
├── backend/
│   ├── server.js              # Main Express server
│   ├── db.js                  # Database connection
│   ├── schema.sql             # Database schema
│   ├── package.json
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── AddProductForm.js
│   │   │   ├── AddRecommendationForm.js
│   │   │   ├── ProductList.js
│   │   │   ├── Cart.js
│   │   │   ├── OrderHistory.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── GrowerDashboard.js
│   │   │   └── CustomerDashboard.js
│   │   ├── services/
│   │   │   └── api.js         # API calls
│   │   ├── styles/            # CSS files
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── public/
```

---

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- Backend: Change PORT in `.env` file
- Frontend: Run `PORT=3001 npm start`

### Database Connection Error
1. Ensure MySQL server is running
2. Check credentials in `.env`
3. Verify database exists: `SHOW DATABASES;`

### CORS Issues
The backend already has CORS enabled. If issues persist:
- Check that both apps are running
- Verify API_URL in `frontend/src/services/api.js` points to backend

### Cart Not Persisting
Cart data is stored in localStorage. Clear browser cache if issues occur:
- Press F12 → Application → Local Storage → Clear

---

## Next Steps (Optional Enhancements)

1. **Add Image Upload**: Store product images
2. **Email Notifications**: Send order confirmations
3. **Admin Dashboard**: Monitor all orders and products
4. **Real Payment Gateway**: Integrate Razorpay/Stripe
5. **Real-time Updates**: Use WebSockets for live notifications
6. **Advanced Search**: Filter products by category, price range
7. **Reviews & Ratings**: Let customers rate products
8. **Inventory Management**: Track stock levels for harvest batches

---

## Support & Issues

If you encounter any issues:
1. Check console errors (F12 in browser)
2. Check terminal for backend errors
3. Verify all services are running
4. Review the API endpoints documentation above

---

## Notes

- All passwords are hashed using bcryptjs
- Authentication uses JWT tokens (expires in 7 days)
- Cart data persists in browser localStorage
- Payment simulation (not connected to real payment gateway)