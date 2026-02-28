# Twilio Integration Guide - MindBridge Phone Authentication & Emergency Alerts

## Overview

This document covers the complete Twilio integration for passwordless phone-based authentication and emergency SOS functionality in MindBridge.

## What Has Been Integrated

### ✅ Backend Components

#### 1. **Twilio Phone Verification Service** (`backend/src/modules/auth/services/TwilioVerifyService.js`)
- Sends OTP via SMS using Twilio Verify API
- Verifies OTP codes submitted by users
- Validates phone numbers in E.164 format

#### 2. **Twilio SOS Service** (`backend/src/modules/alerts/services/TwilioSOSService.js`)
- Triggers emergency voice calls to caregiver
- Uses TwiML to deliver spoken alert message
- Includes elderly person's name in alert message

#### 3. **Authentication Controller** (`backend/src/modules/auth/controllers/AuthController.js`)
Routes:
- `POST /api/v1/auth/send-otp` - Send OTP to phone number
- `POST /api/v1/auth/verify-otp` - Verify OTP and authenticate user

#### 4. **Alert Controller** (`backend/src/modules/alerts/controllers/AlertController.js`)
Routes:
- `POST /api/v1/alerts/sos` - Trigger emergency SOS call

### ✅ Frontend Components

#### 1. **Login Page** (`frontend/src/pages/public/Login.tsx`)
Two-step authentication flow:
- **Step 1**: Enter phone number (E.164 format)
- **Step 2**: Enter 6-digit OTP received via SMS
- Supports role selection (elderly/caregiver)

#### 2. **Authentication Service** (`frontend/src/services/authService.ts`)
API client methods:
- `sendOTP(phoneNumber)` - Request OTP
- `verifyOTP(payload)` - Verify OTP and get auth token
- Token management (get, set, clear)

#### 3. **Auth Store** (`frontend/src/store/authStore.ts`)
Zustand state management:
- `phoneLogin(phoneNumber, token, role)` - Store authenticated user
- Token persistence in localStorage
- Logout functionality

#### 4. **Auth Hook** (`frontend/src/hooks/useAuth.ts`)
React hook providing:
- `user` - Current user object
- `token` - JWT authentication token
- `phoneLogin()` - Phone auth function
- `logout()` - Clear auth session

#### 5. **User Types** (`frontend/src/types/user.types.ts`)
TypeScript types:
- `PhoneAuthPayload` - OTP verification payload
- `AuthResponse` - API response type
- Updated `User` interface with `phoneNumber` field

### ✅ Environment Configuration

#### Backend (.env)
```
TWILIO_ACCOUNT_SID=AC467d5ee309bd8a9519c68acfe147fe94
TWILIO_AUTH_TOKEN=119c5fb6d66d1a45cecace84af090dab
TWILIO_PHONE_NUMBER=+14476002867
CAREGIVER_PHONE_NUMBER=+919082087674
TWILIO_VERIFY_SERVICE_SID=VA876f663a2cf93f142a6b6e4a8feb8488
```

#### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5004/api/v1
VITE_SOCKET_IO_URL=http://localhost:5004
```

## API Endpoints

### Phone Authentication Flow

#### 1. Send OTP
```bash
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "success": true,
    "sid": "VE123abc...",
    "status": "pending",
    "message": "OTP sent to +919876543210"
  },
  "message": "OTP sent to +919876543210"
}
```

#### 2. Verify OTP
```bash
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "code": "123456"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "phoneNumber": "+919876543210",
      "role": "elderly",
      "name": "Elderly User",
      "id": "919876543210"
    }
  },
  "message": "Authentication successful"
}
```

### Emergency SOS

#### Trigger SOS Call
```bash
POST /api/v1/alerts/sos
Content-Type: application/json

{
  "elderlyName": "Margaret Johnson"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "success": true,
    "callSid": "CA123abc...",
    "message": "Emergency call triggered for Margaret Johnson"
  },
  "message": "Emergency call triggered for Margaret Johnson"
}
```

## Frontend User Flow

### Login Flow
1. User lands on `/login` page
2. Selects user type (elderly/caregiver)
3. Enters phone number in E.164 format (e.g., +919876543210)
4. Clicks "Send Security Code"
5. Receives SMS with 6-digit OTP
6. Enters OTP code
7. Clicks "Verify & Login"
8. JWT token stored in localStorage
9. Redirected to dashboard (`/elderly/dashboard` or `/caregiver/dashboard`)

### Session Persistence
- Auth token stored in `localStorage`
- User data stored in `localStorage`
- Protected routes check authentication via `useAuth()` hook
- Automatic logout on token expiration or manual logout

## Testing Phone Authentication

### Using Test Phone Numbers
Twilio Verify provides test phone numbers for development:
- Add $1 credit to your Twilio account
- Use test credentials during signup
- Test mode uses predefined codes

### Manual Testing
1. Start backend: `npm run dev` (from backend folder)
2. Start frontend: `npm run dev` (from frontend folder)
3. Go to `http://localhost:5173/login`
4. Enter phone: `+919876543210`
5. Check Twilio console for OTP or use test credentials
6. Enter OTP code
7. Verify redirect to dashboard

## Integration Points with Existing Code

### Dashboard Integration
The Login component redirects to:
- `/elderly/dashboard` - Uses `<ProtectedRoute role="elderly">`
- `/caregiver/dashboard` - Uses `<ProtectedRoute role="caregiver">`

### User Context
User data available via:
```typescript
const { user, token } = useAuth();
console.log(user.phoneNumber); // Access phone number
console.log(token); // Access JWT token
```

### API Calls with Authentication
```typescript
// Token automatically included in axios requests
import authService from '@/services/authService';
authService.setToken(token); // Setup on login

// All subsequent API calls include Authorization header
```

## SOS Integration

### Frontend Implementation (Example)
```typescript
import axios from 'axios';

const handleSOS = async (elderlyName: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/alerts/sos`,
      { elderlyName }
    );
    console.log('SOS triggered:', response.data);
  } catch (error) {
    console.error('SOS failed:', error);
  }
};
```

### Backend Integration
SOS route available at: `POST /api/v1/alerts/sos`

## Security Considerations

### ✅ Implemented
- E.164 phone number validation
- JWT token-based authentication
- 6-digit OTP validation
- CORS configured for localhost
- Environment variables for sensitive data

### 📋 Recommendations for Production
1. **HTTPS Only** - Use HTTPS for all API calls
2. **Rate Limiting** - Add rate limiting to OTP endpoint
3. **Phone Number Validation** - Verify phone number ownership
4. **Token Refresh** - Implement JWT refresh token rotation
5. **OTP Expiration** - Set OTP expiration time (default: 10 minutes)
6. **Logging** - Log authentication attempts for audit trail
7. **Database** - Store user records in MongoDB with phone verification status

## Troubleshooting

### Issue: "Missing Twilio credentials"
**Solution**: Verify `.env` file has all required variables:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_VERIFY_SERVICE_SID`

### Issue: "Phone number must be in E.164 format"
**Solution**: Phone numbers must start with `+` and country code:
- Valid: `+919876543210`, `+12125551234`
- Invalid: `9876543210`, `919876543210`

### Issue: OTP not received
**Solution**:
1. Check Twilio Console > Phone Numbers > Active
2. Verify phone number is in Verify Service allowed list
3. Check SMS delivery logs
4. Ensure sufficient Twilio account credit

### Issue: Frontend can't reach backend API
**Solution**:
1. Check `VITE_API_BASE_URL` in frontend `.env`
2. Verify backend running on port 5004
3. Check CORS configuration in `backend/src/app.js`
4. Ensure no firewall blocking requests

## File Checklist

### Backend Files ✅
- [x] `backend/src/modules/auth/services/TwilioVerifyService.js`
- [x] `backend/src/modules/auth/controllers/AuthController.js`
- [x] `backend/src/modules/auth/routes/index.js`
- [x] `backend/src/modules/alerts/services/TwilioSOSService.js`
- [x] `backend/src/modules/alerts/controllers/AlertController.js`
- [x] `backend/src/modules/alerts/routes/index.js`
- [x] `backend/.env` - Twilio credentials

### Frontend Files ✅
- [x] `frontend/src/pages/public/Login.tsx` - Phone OTP flow
- [x] `frontend/src/services/authService.ts` - API client
- [x] `frontend/src/store/authStore.ts` - State management
- [x] `frontend/src/hooks/useAuth.ts` - Auth hook
- [x] `frontend/src/types/user.types.ts` - TypeScript types
- [x] `frontend/.env` - API configuration

## Next Steps

1. **Install Dependencies**: Run `npm install` in both backend and frontend folders
2. **Start Backend**: `npm run dev` (backend folder)
3. **Start Frontend**: `npm run dev` (frontend folder)
4. **Test Login**: Navigate to `http://localhost:5173/login`
5. **Integrate Alerts**: Add SOS button to elderly dashboard
6. **Database Integration**: Connect to MongoDB for user persistence
7. **Production Setup**: Configure production Twilio account and environment

## Support Resources

- Twilio Docs: https://www.twilio.com/docs
- Twilio Verify: https://www.twilio.com/docs/verify
- Twilio Voice: https://www.twilio.com/docs/voice
- React Query Example: Check `frontend/src/services/` for API patterns

---

**Last Updated**: February 28, 2026
**Status**: ✅ Ready for Testing
