# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1️⃣ Setup Database
```bash
# Open MySQL and run:
SOURCE /Users/saiabhinav/Desktop/DBMS\ PROJECT/backend/schema.sql;
```

### 2️⃣ Start Backend Server
```bash
cd /Users/saiabhinav/Desktop/DBMS\ PROJECT/backend
npm start
```
✅ Backend running on: http://localhost:5000

### 3️⃣ Start Frontend
```bash
cd /Users/saiabhinav/Desktop/DBMS\ PROJECT/frontend
npm start
```
✅ Frontend running on: http://localhost:3000

---

## 🔑 Test Credentials

### For Grower Login:
- **Grower ID**: 1
- **Name**: John Smith

### For Customer:
- **Email**: Use register button to create account
- Or use: test@example.com / password: test123

---

## 📱 Test Flow

### Grower Flow:
1. Login with Grower ID: 1, Name: John Smith
2. View profile and plots
3. Click "Add Product" → Add a product
4. Click "Add Recommendation" → Add farming recommendations

### Customer Flow:
1. Click Register → Create new account
2. View available products
3. Add products to cart
4. Go to cart and proceed to payment
5. Choose payment method (card/UPI/bank/cash)
6. Check Order History

---

## 🔧 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `PORT=3001 npm start` |
| Port 5000 in use | Change PORT in backend/.env |
| Database error | Ensure MySQL is running, check credentials in .env |
| Blank page | Clear browser cache (Ctrl+Shift+Delete) |
| Cart not saving | Check browser's localStorage |

---

## 📁 Key Files Created

```
backend/
  ├── server.js          # API server
  ├── db.js              # Database connection
  ├── schema.sql         # Database setup
  └── .env               # Configuration

frontend/
  ├── src/
  │   ├── components/    # React components
  │   ├── pages/         # Page components
  │   ├── context/       # Auth state management
  │   ├── services/      # API calls
  │   ├── styles/        # CSS files
  │   └── App.js         # Main app
```

---

## ✨ Features Implemented

✅ User Authentication (Grower & Customer)
✅ Grower Dashboard (Profile, Products, Recommendations)
✅ Customer Dashboard (Browse, Cart, Orders, Payment)
✅ Product Management (Add, View, Categories)
✅ Shopping Cart with localStorage persistence
✅ Order Management (Create, View, Track)
✅ Payment Gateway Integration (Simulated)
✅ Responsive Design (Mobile & Desktop)
✅ JWT Authentication & Authorization
✅ Database with relationships

---

## 📖 Full Documentation
See `SETUP_INSTRUCTIONS.md` for comprehensive setup and API documentation.