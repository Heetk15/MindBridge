# Unified Signup + Phone Auth Guide

## 📋 Flow Diagram

```
SIGNUP PAGE (Step 1: Email/Password)
  ↓
User enters: Name, Email, Password, Role
  ↓
SIGNUP PAGE (Step 2: Phone)
  ↓
User enters phone (E.164 format)
  ↓
API Call: POST /api/v1/auth/signup
  ↓
Backend creates user in MongoDB
  ↓
Returns JWT token
  ↓
Store token in localStorage
  ↓
Auto-login to Dashboard

---

LOGIN PAGE (Phone + OTP)
  ↓
User enters phone number
  ↓
API Call: POST /api/v1/auth/send-otp
  ↓
Twilio sends SMS
  ↓
User enters OTP
  ↓
API Call: POST /api/v1/auth/verify-otp
  ↓
User found/created in database
  ↓
Returns JWT token
  ↓
Auto-login to Dashboard
```

---

## 🧪 Testing Steps

### 1. **Test Signup (Email/Password)**
1. Go to http://localhost:8081/signup
2. Fill form:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password123`
   - Role: `elderly`
   - Click "Continue"
3. Enter phone: `+919876543210` (or your verified Twilio number)
4. Click "Create Account"
5. **Check MongoDB** → `mindbridge.users` collection

Expected output:
```json
{
  "_id": "ObjectId...",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password...",
  "role": "elderly",
  "phoneNumber": "+919876543210",
  "isPhoneVerified": true,
  "createdAt": "2026-02-28T...",
  "updatedAt": "2026-02-28T..."
}
```

---

### 2. **Test Phone Login (OTP)**

If user already created from signup:
1. Go to http://localhost:8081/login
2. Enter: `+919876543210` (the phone from signup)
3. Get OTP (check Twilio/console for code)
4. Enter OTP code
5. Auto-login to dashboard

If new phone number:
1. Same as above
2. New user auto-created on OTP verification

---

### 3. **View Database Data**

**Check All Users:**
```bash
curl http://localhost:5004/api/v1/admin/users
```

Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "elderly",
      "phoneNumber": "+919876543210",
      "createdAt": "..."
    }
  ]
}
```

**Get Database Stats:**
```bash
curl http://localhost:5004/api/v1/admin/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalUsers": 2,
    "totalHealthRecords": 0,
    "totalCognitiveScores": 0,
    "usersByRole": [
      { "_id": "elderly", "count": 2 }
    ],
    "recentUsers": 2
  }
}
```

**Get Specific User:**
```bash
curl http://localhost:5004/api/v1/admin/users/{userId}
```

---

## 🛠️ API Endpoints

### **Authentication**

#### Signup
```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "elderly",
  "phoneNumber": "+919876543210"
}

Response (201):
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "elderly",
      "phoneNumber": "+919876543210"
    }
  }
}
```

#### Send OTP
```bash
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210"
}

Response:
{
  "success": true,
  "sid": "VE...",
  "status": "pending"
}
```

#### Verify OTP
```bash
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "code": "123456"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "_id": "...",
      "name": "User 3210",
      "phoneNumber": "+919876543210",
      "role": "elderly"
    }
  }
}
```

---

### **Admin/Database**

#### Get All Users
```bash
GET /api/v1/admin/users
```

#### Get Database Stats
```bash
GET /api/v1/admin/stats
```

#### Get Specific User with Related Data
```bash
GET /api/v1/admin/users/{userId}
```

---

## 📊 Database Schema

### User Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password": "string (hashed with bcrypt)",
  "phoneNumber": "string (E.164 format, optional)",
  "role": "elderly | caregiver | doctor",
  "isPhoneVerified": "boolean",
  "avatar": {
    "url": "string (Cloudinary URL)",
    "publicId": "string (Cloudinary public ID)"
  },
  "createdAt": "Date",
  "updatedAt": "Date",
  "lastLogin": "Date"
}
```

---

## ✅ What's Changed

### Frontend
- ✅ Signup.tsx - 2-step form (email + phone)
- ✅ authService.ts - Added signup() method
- ✅ authStore.ts - Real backend integration (removed mocks)

### Backend
- ✅ AuthController.js - Added signup() method
- ✅ AuthController.js - verifyOTP now saves users to DB
- ✅ auth/routes/index.js - Added /signup route
- ✅ AdminController.js - New admin routes
- ✅ app.js - Registered admin routes

---

## 🎯 What to Test Next

1. **Signup with email** → Check users in DB
2. **Login with phone** → Check lastLogin updated in DB
3. **Multiple signups** → Verify all users in DB ✓
4. **Admin endpoints** → curl /api/v1/admin/stats
5. **Email/password login** → (TODO - implement)

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Phone number already registered" | Different phone number in step 2 |
| "User with this email already exists" | Use different email in signup |
| OTP not received | Make sure phone is verified in Twilio |
| User not in DB | Check browser console for error messages |
| "Invalid E.164 format" | Use format like +919876543210 |

---

## 📱 Test Users Created

After testing locally:
```
Email Signup:
- john.doe@test.com → +919876543210 → elderly
- jane.smith@test.com → +919876543211 → caregiver

OTP Login:
- +919876543212 → Creates new user on first verify
```

Run this to see all test users:
```bash
curl http://localhost:5004/api/v1/admin/users | jq '.'
```

---

**Ready to test! Let me know what happens** 🚀
