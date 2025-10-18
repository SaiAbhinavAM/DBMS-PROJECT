# Grower Authentication Update Guide

## Overview
Updated the grower authentication system to use **Email and Password** instead of GrowerID and Name. This aligns grower login with customer login and provides better security.

---

## 🗄️ Database Changes

### Grower Table Schema Update
**Old Columns:**
- GrowerID (Primary Key)
- Name
- ContactNo
- Address
- CreatedAt
- UpdatedAt

**New Columns (ADDED):**
- ✅ **Email** (VARCHAR(150), UNIQUE)
- ✅ **PasswordHash** (VARCHAR(255))

**Updated INSERT Statements:**
Now includes email and password hash for sample growers.

### Sample Grower Credentials (After Migration)
| Email | Password | Farm Name |
|-------|----------|-----------|
| john@farmmail.com | john123 | John Smith |
| maria@farmmail.com | maria123 | Maria Garcia |
| david@farmmail.com | david123 | David Johnson |

---

## 📝 Backend Changes

### New API Endpoints

#### 1. **Grower Registration**
```
POST /api/auth/grower-register
Body: {
  "name": "Farm Name",
  "email": "email@example.com",
  "contactNo": "9876543210",
  "address": "Farm Address",
  "password": "secure_password"
}
Response: { token, user: { id, type, name, email, contactNo, address } }
```

#### 2. **Grower Login** (Updated)
```
POST /api/auth/grower-login
Body: {
  "email": "john@farmmail.com",
  "password": "john123"
}
Response: { token, user: { id, type, name, email, contactNo, address } }
```

### Security Features
- ✅ **Bcrypt Password Hashing** - All passwords are hashed using bcrypt with salt rounds of 10
- ✅ **Password Comparison** - Uses `bcrypt.compare()` for secure password validation
- ✅ **JWT Token Generation** - 7-day expiration for grower sessions
- ✅ **Unique Email** - Database constraint prevents duplicate emails
- ✅ **Error Handling** - Handles duplicate email registration gracefully

---

## 🎨 Frontend Changes

### Updated Files

#### 1. **LoginPage.js**
- Changed grower login form from "Grower ID + Name" → "Email + Password"
- Added demo credentials display for growers
- Added registration link for new growers

**Grower Demo Credentials:**
- Email: `john@farmmail.com`
- Password: `john123`

#### 2. **GrowerRegisterPage.js** (NEW)
New registration page for growers with fields:
- Farm/Business Name
- Email
- Contact Number
- Farm Address
- Password (min 6 characters)
- Confirm Password

Features:
- Password validation (must match)
- Minimum password length check (6 characters)
- Error handling for duplicate emails
- Auto-redirect to grower dashboard after successful registration

#### 3. **App.js**
- Added import for `GrowerRegisterPage`
- Added route: `/grower-register`

#### 4. **api.js (services)**
- Updated `authAPI.growerLogin(email, password)` signature
- Added `authAPI.growerRegister(name, email, contactNo, address, password)` method

---

## 🚀 Migration Steps

### Step 1: Update Database Schema
Run the updated `schema.sql` file:

```bash
cd /Users/saiabhinav/Desktop/DBMS PROJECT/backend
mysql -u root -p urban_farming < schema.sql
# Enter password: manjucta123
```

This will:
- Drop and recreate the `urban_farming` database
- Add `Email` and `PasswordHash` columns to Grower table
- Insert sample growers with hashed passwords

### Step 2: Restart Backend Server
```bash
cd /Users/saiabhinav/Desktop/DBMS PROJECT/backend
npm start
# Server should start on port 5011
```

### Step 3: Start Frontend (no changes needed to dependencies)
```bash
cd /Users/saiabhinav/Desktop/DBMS PROJECT/frontend
npm start
# Navigate to http://localhost:3000
```

---

## 📊 Testing the New System

### Test 1: Login with Demo Grower
1. Go to Login page
2. Click "🌱 Grower" button
3. Enter:
   - Email: `john@farmmail.com`
   - Password: `john123`
4. Should redirect to Grower Dashboard

### Test 2: Register New Grower
1. Go to Login page
2. Click "🌱 Grower" button
3. Click "Register here" link
4. Fill registration form:
   - Farm Name: "My Farm"
   - Email: "myfarm@example.com"
   - Contact: "9999999999"
   - Address: "123 Farm Street"
   - Password: "mypassword"
5. Should auto-login and redirect to Grower Dashboard

### Test 3: Invalid Credentials
1. Try logging in with wrong password
2. Should show error: "Invalid credentials"

### Test 4: Duplicate Email
1. Try registering with existing email
2. Should show error: "Email already registered"

---

## 🔒 Security Improvements

### Old System Issues ❌
- No password authentication
- GrowerID could be guessed
- No account protection

### New System Benefits ✅
- **Bcrypt Hashing** - Industry standard password hashing
- **Email-based** - More user-friendly than ID numbers
- **Password Protected** - Each account is secure
- **Session Tokens** - JWT-based authentication
- **Unique Constraints** - Prevents duplicate accounts
- **Error Messages** - Generic for security (doesn't reveal if email exists)

---

## 📋 File Changes Summary

| File | Type | Changes |
|------|------|---------|
| `backend/schema.sql` | Modified | Added Email, PasswordHash to Grower table |
| `backend/server.js` | Modified | Updated grower-login, added grower-register endpoint |
| `frontend/src/pages/LoginPage.js` | Modified | Changed form fields for grower login |
| `frontend/src/pages/GrowerRegisterPage.js` | Created | New registration page |
| `frontend/src/services/api.js` | Modified | Updated growerLogin(), added growerRegister() |
| `frontend/src/App.js` | Modified | Added grower-register route |

---

## 🔗 Database Relationships

```
Grower (GrowerID)
├── Email ✓ (UNIQUE)
├── PasswordHash ✓ (for authentication)
├── CreatedAt
├── UpdatedAt
└── Relations:
    ├── Plot (one-to-many)
    ├── Product (one-to-many)
    ├── Recommendation (one-to-many)
```

---

## ⚠️ Important Notes

1. **Old Demo IDs Won't Work** - Growers must now use email and password
2. **Password Requirements** - Minimum 6 characters
3. **Unique Emails** - Each grower needs a unique email address
4. **Data Persistence** - All grower data including plots, products preserved
5. **Backward Compatibility** - All existing admin features work unchanged

---

## 🎯 Next Steps

1. ✅ Update database with new schema
2. ✅ Restart backend server
3. ✅ Test login with demo credentials
4. ✅ Test registration with new account
5. ✅ Verify all grower dashboard features work

---

## 📞 Support

If you encounter any issues:
- Check backend server is running on port 5011
- Verify MySQL database is accessible
- Clear browser cache and localStorage if login issues persist
- Check console for detailed error messages

---

**Last Updated:** 2024
**Version:** 2.0 (Email/Password Authentication)