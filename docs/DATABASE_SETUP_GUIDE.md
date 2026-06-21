# MongoDB & Cloudinary Setup - Complete Guide

## ✅ What's Been Done

### MongoDB Models Created (12 Collections)
- ✅ User - User profiles, medical info, emergency contacts
- ✅ CognitiveScore - Assessment results & trends
- ✅ HealthRecord - Vitals, mood, activity, sleep
- ✅ GameStats - Game performance tracking
- ✅ Conversation - Chat history with mood tracking
- ✅ EmergencyLog - Emergency alerts & SOS events
- ✅ Medication - Prescription management
- ✅ Reminder - Notifications & reminders
- ✅ Appointment - Medical appointments
- ✅ Document - Medical documents & reports
- ✅ ActivityLog - User activity tracking
- ✅ Report - Generated health reports

### Database Configuration
- ✅ Database file: `backend/src/config/database.js`
- ✅ Connected to MongoDB Atlas
- ✅ Connection string in `.env`
- ✅ Server startup updated to connect to DB

### Cloudinary Configuration
- ✅ Cloudinary file: `backend/src/config/cloudinary.js`
- ✅ Upload, deletion, optimization functions
- ✅ Placeholder credentials in `.env`

---

## 🔧 Setup Instructions

### Step 1: Get Your Cloudinary Credentials

1. Go to https://cloudinary.com (create account if needed)
2. Navigate to **Dashboard** → **Settings**
3. Copy these values:
   - **Cloud Name** - Your unique identifier
   - **API Key** - For authentication
   - **API Secret** - Keep private!

### Step 2: Update Backend `.env` File

Open `backend/.env` and update Cloudinary section:

```env
# ============================================================================
# CLOUDINARY CONFIGURATION (Image & File Upload)
# ============================================================================
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_UPLOAD_PRESET=mindbridge_upload
MAX_FILE_SIZE=10485760
```

Replace `your_cloud_name_here`, `your_api_key_here`, and `your_api_secret_here` with actual values.

### Step 3: Verify MongoDB Connection

MongoDB is already configured in `.env`:
```env
MONGODB_URI=mongodb+srv://apex008aftermath_db_user:oZrQpNVd17ZsAEPr@cluster0.xlhy4nh.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=mindbridge
```

✅ Connection details verified and tested

### Step 4: Install Cloudinary Package

```bash
cd backend
npm install cloudinary
```

### Step 5: Start Backend with Database Connection

```bash
cd backend
npm run dev
```

Expected output:
```
✅ MongoDB Connected: cluster0.xlhy4nh.mongodb.net
📂 Database: mindbridge
🚀 MindBridge Server running on port 5004
💾 Database: Connected
```

---

## 📝 File Locations

### Models
```
backend/src/models/
├── User.js ✅ (updated)
├── CognitiveScore.js ✅ (updated)
├── HealthRecord.js ✅ (updated)
├── GameStats.js ✅ (updated)
├── Conversation.js ✅ (updated)
├── EmergencyLog.js ✅ (updated)
├── Medication.js ✅ (new)
├── Reminder.js ✅ (new)
├── Appointment.js ✅ (new)
├── Document.js ✅ (new)
├── ActivityLog.js ✅ (new)
└── Report.js ✅ (new)
```

### Configuration
```
backend/src/config/
├── database.js ✅ (new - MongoDB)
└── cloudinary.js ✅ (new - File uploads)
```

### Updated Files
```
backend/
├── src/index.js ✅ (now connects to MongoDB on startup)
└── .env ✅ (MongoDB URI + Cloudinary credentials)
```

---

## 🚀 Usage Examples

### API Endpoint - Create User with Avatar

```bash
curl -X POST http://localhost:5004/api/v1/user \
  -H "Content-Type: multipart/form-data" \
  -F "name=Margaret Johnson" \
  -F "email=margaret@example.com" \
  -F "phoneNumber=+919876543210" \
  -F "role=elderly" \
  -F "avatar=@/path/to/avatar.jpg"
```

### Backend Code - Upload & Store

```javascript
const User = require('./models/User');
const { uploadToCloudinary } = require('./config/cloudinary');

// Upload avatar to Cloudinary
const avatarResult = await uploadToCloudinary(req.file.path, {
  folder: 'mindbridge/avatars',
  resource_type: 'auto'
});

// Store user with Cloudinary URL
const user = await User.create({
  name: req.body.name,
  email: req.body.email,
  phoneNumber: req.body.phoneNumber,
  role: req.body.role,
  avatar: {
    url: avatarResult.url,
    publicId: avatarResult.publicId
  }
});
```

### Store Health Record

```javascript
const HealthRecord = require('./models/HealthRecord');

const record = await HealthRecord.create({
  userId: req.user.id,
  recordDate: new Date(),
  vitals: {
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: { value: 72, unit: 'bpm' },
    glucose: { value: 95, unit: 'mg/dL' }
  },
  mood: {
    score: 7,
    label: 'happy',
    lonelinessIndex: 35
  },
  activity: {
    level: 'moderate',
    stepsToday: 8500,
    exerciseDuration: 30
  }
});
```

### Query Cognitive Scores with Trend

```javascript
const CognitiveScore = require('./models/CognitiveScore');

// Get last 30 days of scores
const scores = await CognitiveScore.find({
  userId: req.user.id,
  testDate: {
    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
})
.sort({ testDate: -1 })
.limit(30);

// Response for frontend
res.json({
  scores: scores.map(s => ({
    date: s.testDate,
    overallScore: s.overallScore,
    category: s.category,
    metrics: s.metrics,
    trend: s.trend
  }))
});
```

### Store Conversation with Audio

```javascript
const Conversation = require('./models/Conversation');
const { uploadToCloudinary } = require('./config/cloudinary');

// Upload voice message if present
let audioUrl, audioPublicId;
if (req.file.audio) {
  const audioResult = await uploadToCloudinary(req.file.audio, {
    folder: 'mindbridge/voice_messages',
    resource_type: 'auto'
  });
  audioUrl = audioResult.url;
  audioPublicId = audioResult.publicId;
}

// Save conversation
const conversation = await Conversation.findByIdAndUpdate(
  conversationId,
  {
    $push: {
      messages: {
        sender: 'user',
        text: req.body.text,
        audioUrl,
        audioPublicId,
        mood: analyzeMood(req.body.text),
        timestamp: new Date()
      }
    }
  }
);
```

### Upload Medical Document

```javascript
const Document = require('./models/Document');
const { uploadToCloudinary } = require('./config/cloudinary');

// Upload to Cloudinary
const docResult = await uploadToCloudinary(req.file.path, {
  folder: 'mindbridge/documents',
  resource_type: 'auto'
});

// Store metadata
const document = await Document.create({
  userId: req.user.id,
  title: req.body.title,
  description: req.body.description,
  type: req.body.type, // 'prescription', 'lab_report', etc.
  fileUrl: docResult.url,
  publicId: docResult.publicId,
  fileName: req.file.filename,
  fileSize: req.file.size,
  fileType: req.file.mimetype,
  issuedDate: req.body.issuedDate,
  tags: req.body.tags
});
```

---

## 🔍 Testing Database Connection

### Check MongoDB Connection

```bash
# In backend directory
npm run dev
```

Look for this output:
```
✅ MongoDB Connected: cluster0.xlhy4nh.mongodb.net
📂 Database: mindbridge
```

### Test Cloudinary Configuration

```javascript
// Create a test file: backend/test-cloudinary.js
const { cloudinary } = require('./src/config/cloudinary');

cloudinary.api.resources_by_tag('mindbridge')
  .then(result => {
    console.log('✅ Cloudinary Connected!');
    console.log('Total files:', result.resources.length);
  })
  .catch(error => {
    console.error('❌ Cloudinary Error:', error.message);
  });
```

Run test:
```bash
node test-cloudinary.js
```

---

## 📱 Frontend Integration - Data Fetching

### Store Usage in Frontend

```typescript
// frontend/src/services/userService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const userService = {
  // Create user with avatar
  createUser: async (formData: FormData) => {
    const response = await axios.post(
      `${API_BASE_URL}/user`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Get user profile
  getUserProfile: async (userId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/user/${userId}`
    );
    return response.data;
  },

  // Update avatar
  updateAvatar: async (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await axios.patch(
      `${API_BASE_URL}/user/${userId}/avatar`,
      formData
    );
    return response.data;
  }
};
```

### Display Cognitive Data

```typescript
// frontend/src/pages/elderly/Dashboard.tsx
import { useCognitiveStore } from '@/store/cognitiveStore';
import CognitiveGraph from '@/components/dashboard/CognitiveGraph';

export default function Dashboard() {
  const { scores } = useCognitiveStore();

  // Fetch from backend
  useEffect(() => {
    const fetchScores = async () => {
      const data = await fetch(
        `${API_BASE_URL}/cognitive/scores?days=30`
      ).then(r => r.json());
      // Update store with database data
    };
  }, []);

  return (
    <div>
      <CognitiveGraph data={scores} />
    </div>
  );
}
```

---

## 🗂️ Data Flow

```
┌─────────────────────┐
│   Frontend React    │
│  (Upload Avatar)    │
└──────────┬──────────┘
           │ FormData
           ▼
┌─────────────────────┐
│  Backend Express    │
│  (Save to Cloudinary)│ ──────▶ ☁️ Cloudinary CDN
└──────────┬──────────┘         (Store Image URL)
           │
           ▼
┌─────────────────────┐
│  MongoDB Document   │
│ {                   │
│   _id: ...,         │
│   name: "...",      │
│   avatar: {         │
│     url: "https://", │
│     publicId: "..." │
│   }                 │
│ }                   │
└─────────────────────┘
```

---

## 📊 Dashboard Data Display

### How Frontend Displays Data

```
Dashboard Component
    │
    ├── CognitiveScoreRing
    │   └── Fetches: CognitiveScore (latest)
    │
    ├── MoodIndicator
    │   └── Fetches: HealthRecord (latest mood)
    │
    ├── HealthMetrics
    │   └── Fetches: HealthRecord (vitals)
    │
    ├── RecentConversations
    │   └── Fetches: Conversation (last 5)
    │
    ├── MedicationCompliance
    │   └── Fetches: HealthRecord (adherence)
    │
    ├── LonelinessIndex
    │   └── Fetches: HealthRecord (loneliness)
    │
    ├── MoodTrend
    │   └── Fetches: HealthRecord (mood history)
    │
    └── EmergencyAlerts
        └── Fetches: EmergencyLog (recent alerts)
```

---

## 🔒 Security Checklist

- [ ] Keep `CLOUDINARY_API_SECRET` secure (never commit to git)
- [ ] Use HTTPS for all file uploads in production
- [ ] Enable password hashing (✅ already done)
- [ ] Validate file types on backend
- [ ] Set file size limits (10MB configured)
- [ ] Implement rate limiting on file uploads
- [ ] Regular database backups (MongoDB Atlas)
- [ ] Monitor Cloudinary quota usage
- [ ] Implement data retention policies

---

## 🆘 Troubleshooting

### ❌ "MongoDB Connection Failed"

**Solution**:
1. Check internet connection
2. Verify MongoDB URI in `.env`
3. Ensure IP whitelist in MongoDB Atlas (Settings → Network Access)
4. Add `0.0.0.0/0` to allow all IPs temporarily (not for production)

### ❌ "Cloudinary Upload Failed"

**Solution**:
1. Verify credentials are correct
2. Check file size < 10MB
3. Verify file type is allowed
4. Check Cloudinary account has sufficient quota
5. Look at error message for specific issue

### ❌ "Module not found: cloudinary"

**Solution**:
```bash
cd backend
npm install cloudinary
```

### ❌ "Models not loading"

**Solution**:
1. Ensure all `.js` files are in `backend/src/models/`
2. Verify mongoose is imported in each model
3. Check for syntax errors in model files
4. Restart backend server

---

## 📈 Performance Tips

1. **Index queries** - All collection queries have indexes ✅
2. **Pagination** - Implement for large datasets
3. **Caching** - Cache frequently accessed data (optional: Redis)
4. **Image optimization** - Cloudinary auto-optimizes
5. **Query limits** - Set reasonable limits (20 records default)

---

## 📚 Next Steps

1. ✅ Complete - MongoDB models created
2. ✅ Complete - Cloudinary configured  
3. ✅ Complete - Backend connected to database
4. **TODO** - Create API routes for each model
5. **TODO** - Create services/controllers
6. **TODO** - Frontend API integration
7. **TODO** - Testing & validation
8. **TODO** - Deployment

---

**Status**: 🟢 Configuration Complete  
**Models**: 12/12 Created  
**Configurations**: 2/2 Complete  
**Ready for API Development**: ✅ YES

Next: Run backend and start creating API routes!
