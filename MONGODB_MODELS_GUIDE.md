# MongoDB Models & Cloudinary Setup Guide

## 📊 Complete Data Model Architecture

### Database: MongoDB Atlas
- **Connection**: `mongodb+srv://apex008aftermath_db_user:oZrQpNVd17ZsAEPr@cluster0.xlhy4nh.mongodb.net`
- **Database Name**: `mindbridge`

### File Storage: Cloudinary CDN
- **Purpose**: Store avatars, medical documents, test results, and images
- **Max File Size**: 10MB per file
- **Supported Types**: Images, PDFs, Documents

---

## 📁 MongoDB Collections & Models

### 1. **User** - User Accounts & Profiles
**Purpose**: Store user information, medical history, medications, emergency contacts

**Fields**:
```javascript
{
  // Basic Info
  name: String (required),
  email: String (unique),
  phoneNumber: String (unique),
  password: String (hashed),
  role: 'elderly' | 'caregiver' | 'doctor',
  
  // Profile
  age: Number,
  gender: String,
  avatar: { url, publicId },  // Cloudinary
  dateOfBirth: Date,
  address, city, country, postalCode,
  
  // Medical Info
  medicalHistory: [String],
  medications: [{
    name, dosage, frequency, prescribedBy, startDate, endDate, notes
  }],
  allergies: [String],
  bloodType: String,
  primaryPhysician: { name, phone, email },
  
  // Emergency
  emergencyContacts: [{
    name, relationship, phone, email, isPrimary
  }],
  
  // Caregiver/Doctor
  assignedElderly: [ObjectId],  // For caregivers
  caregiverSince: Date,
  licenseNumber: String,        // For doctors
  specialty: String,
  
  // Account
  isPhoneVerified: Boolean,
  isEmailVerified: Boolean,
  isActive: Boolean,
  lastLogin: Date,
  notificationPreferences
}
```

**Usage Example**:
```javascript
const User = require('./models/User');

// Create user
const user = await User.create({
  name: 'Margaret Johnson',
  email: 'margaret@example.com',
  phoneNumber: '+919876543210',
  role: 'elderly',
  age: 78,
  medicalHistory: ['Type 2 Diabetes', 'Hypertension']
});
```

---

### 2. **CognitiveScore** - Cognitive Assessment Results
**Purpose**: Track cognitive health metrics and trends

**Fields**:
```javascript
{
  userId: ObjectId (ref: User),
  overallScore: Number (0-100),
  testDate: Date,
  metrics: {
    memory: Number,
    attention: Number,
    language: Number,
    visuospatial: Number,
    executiveFunction: Number,
    processing: Number
  },
  category: 'memory' | 'attention' | 'language' | ...,
  testType: 'mmse' | 'moca' | 'game_based' | ...,
  trend: 'improving' | 'stable' | 'declining',
  assessmentNotes: String,
  flag: Boolean,               // For concerning trends
  reviewedBy: ObjectId,        // Doctor review
  timestamps
}
```

**Dashboard Display**:
- CognitiveScoreRing shows current `overallScore`
- CognitiveGraph displays trend over time  
- Tests categorized by type

---

### 3. **HealthRecord** - Daily/Regular Health Data
**Purpose**: Store vital signs, activity, mood, medications taken

**Fields**:
```javascript
{
  userId: ObjectId,
  recordDate: Date,
  
  // Vitals
  vitals: {
    bloodPressure: { systolic, diastolic },
    heartRate: { value, unit: 'bpm' },
    temperature: { value, unit: 'C' },
    glucose: { value, unit: 'mg/dL' },
    spO2: { value, unit: '%' }
  },
  
  // Activity & Sleep
  activity: {
    level: 'sedentary' | 'light' | 'moderate' | 'vigorous',
    stepsToday: Number,
    caloriesBurned: Number,
    exerciseDuration: Number
  },
  sleep: {
    hoursSlept: Number,
    quality: 'poor' | 'fair' | 'good' | 'excellent'
  },
  
  // Mood
  mood: {
    score: Number (1-10),
    label: String,
    lonelinessIndex: Number (0-100)
  },
  
  // Nutrition
  nutrition: {
    mealsLogged: [{
      mealType, description, calories, timestamp
    }],
    waterIntake: Number
  },
  
  // Medications
  medicationsTaken: [{
    medicationId, name, dosage, time, confirmed
  }],
  
  // Symptoms
  symptoms: [{
    symptom, severity: 'mild' | 'moderate' | 'severe'
  }],
  
  notes: String
}
```

**Dashboard Display**:
- HealthMetrics shows vitals overview
- MoodTrend displays mood history
- MedicationCompliance tracks adherence
- LonelinessIndex shows isolation metrics

---

### 4. **GameStats** - Game Performance Data
**Purpose**: Track cognitive game results and improvements

**Fields**:
```javascript
{
  userId: ObjectId,
  gameName: 'memory_match' | 'pattern_recognition' | 'word_recall' | ...,
  score: Number,
  accuracy: Number (0-100),
  level: Number,
  difficulty: 'easy' | 'medium' | 'hard',
  timePlayedSeconds: Number,
  reactionTime: Number,
  moves: Number,
  actualMoves: Number,
  isCompleted: Boolean,
  datePlayed: Date,
  performance: {
    improved: Boolean,
    improvement: Number,
    personalBest: Boolean
  }
}
```

**Dashboard Display**:
- Shows recent game results
- Tracks personal bests
- Displays performance trends

---

### 5. **Conversation** - Chat Conversations
**Purpose**: Store elderly-AI conversations with mood tracking

**Fields**:
```javascript
{
  userId: ObjectId,
  title: String,
  summary: String,
  emotionalTrend: String,
  
  messages: [{
    sender: 'user' | 'ai',
    text: String,
    audioUrl: String,        // Cloudinary if voice
    mood: String,
    sentiment: 'positive' | 'neutral' | 'negative',
    timestamp: Date
  }],
  
  status: 'active' | 'archived',
  messageCount: Number,
  averageMoodScore: Number,
  primaryThemes: [String],
  startedAt: Date,
  endedAt: Date,
  duration: Number
}
```

**Dashboard Display**:
- RecentConversations shows last chats
- Mood tracking in each message
- Emotional trend analysis

---

### 6. **EmergencyLog** - Emergency Alerts & SOS Events
**Purpose**: Track emergency situations and responses

**Fields**:
```javascript
{
  userId: ObjectId,
  alertType: 'panic_button' | 'fall_detected' | 'inactivity' | ...,
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: String,
  status: 'triggered' | 'acknowledged' | 'in_progress' | 'resolved' | 'false_alarm',
  priority: Number (1-5),
  
  location: {
    latitude, longitude,
    address,
    accuracy
  },
  
  // Timeline
  triggeredAt: Date,
  acknowledgedAt: Date,
  resolvedAt: Date,
  resolvedBy: ObjectId,
  
  // Contacts Made
  contactsMade: [{
    contactId: ObjectId,
    contactType: 'phone_call' | 'sms' | 'email' | 'in_person',
    status: 'attempted' | 'successful' | 'failed',
    timestamp: Date
  }],
  
  resolutionNotes: String,
  emergencyServicesNotified: Boolean,
  ambulanceRequested: Boolean
}
```

**Dashboard Display**:
- EmergencyAlerts shows recent alerts
- Caregiver view shows full history
- Status tracking and resolution

---

### 7. **Medication** - Medication Management
**Purpose**: Track prescriptions and adherence

**Fields**:
```javascript
{
  userId: ObjectId,
  name: String (required),
  dosage: String,
  frequency: 'once_daily' | 'twice_daily' | ... | 'as_needed',
  scheduleTimes: [String],  // e.g., ["08:00", "20:00"]
  prescribedBy: { doctorName, hospitalName },
  purpose: String,
  sideEffects: [String],
  interactions: [String],
  
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  
  adherenceRate: Number (0-100),
  missedDoses: Number,
  totalDoses: Number
}
```

---

### 8. **Reminder** - Notifications & Reminders
**Purpose**: Schedule and track reminders for medications, appointments, etc.

**Fields**:
```javascript
{
  userId: ObjectId,
  type: 'medication' | 'appointment' | 'exercise' | 'meal' | ...,
  title: String,
  description: String,
  
  scheduledTime: Date,
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly',
  
  medicationId: ObjectId,   // Link to medication
  appointmentId: ObjectId,  // Link to appointment
  
  isActive: Boolean,
  isCompleted: Boolean,
  completedAt: Date,
  
  notificationMethod: ['push' | 'sms' | 'email' | 'voice_call'],
  notificationSent: Boolean,
  priority: 'low' | 'medium' | 'high'
}
```

---

### 9. **Appointment** - Medical Appointments
**Purpose**: Schedule and track doctor/specialist appointments

**Fields**:
```javascript
{
  userId: ObjectId,
  doctorId: ObjectId,
  
  title: String,
  type: 'general_checkup' | 'specialist' | 'lab_test' | 'therapy' | ...,
  description: String,
  concerns: [String],
  
  location: {
    hospitalName, address, city, phone
  },
  
  scheduledDateTime: Date,
  estimatedDuration: Number,
  actualDuration: Number,
  
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
  
  notes: String,
  prescription: String,
  testResults: [{
    testName, result, url (Cloudinary), publicId
  }],
  followUpRequired: Boolean,
  followUpDate: Date,
  
  attachments: [{
    url (Cloudinary), name, type, publicId
  }]
}
```

---

### 10. **Document** - Medical Documents & Records
**Purpose**: Store and organize medical files (prescriptions, lab reports, etc.)

**Fields**:
```javascript
{
  userId: ObjectId,
  title: String,
  description: String,
  type: 'prescription' | 'lab_report' | 'discharge' | 'x_ray' | 'scan' | ...,
  
  // Cloudinary
  fileUrl: String,
  publicId: String,
  fileName: String,
  fileSize: Number,
  fileType: String,
  
  // Metadata
  issuedDate: Date,
  expiryDate: Date,
  issuedBy: String,
  issuingInstitution: String,
  
  // Access
  isPublic: Boolean,
  sharedWith: [{
    userId: ObjectId,
    accessLevel: 'view' | 'edit' | 'comment'
  }],
  
  isVerified: Boolean,
  verifiedBy: ObjectId,
  
  tags: [String],
  notes: String
}
```

**Dashboard Display**:
- HealthPassport shows relevant documents
- Sharing with caregivers/doctors
- Quick access to recent records

---

### 11. **ActivityLog** - User Activity Tracking
**Purpose**: Track all user activities for analytics and reporting

**Fields**:
```javascript
{
  userId: ObjectId,
  activityType: 'game_played' | 'chat_conversation' | 'health_update' | 'login' | ...,
  description: String,
  
  relatedEntity: 'game' | 'conversation' | 'health_record' | ...,
  relatedEntityId: ObjectId,
  
  duration: Number,           // in seconds
  intensity: 'low' | 'medium' | 'high',
  caloriesBurned: Number,
  
  outcome: String,
  score: Number,
  isPrivate: Boolean,
  timestamp: Date
}
```

---

### 12. **Report** - Generated Health Reports
**Purpose**: Generate and store comprehensive health reports

**Fields**:
```javascript
{
  userId: ObjectId,
  reportType: 'cognitive_assessment' | 'health_summary' | 'medication_adherence' | ...,
  
  title: String,
  startDate: Date,
  endDate: Date,
  
  sections: [{
    sectionName, content, charts, insights
  }],
  
  summary: {
    averageCognitiveScore: Number,
    averageMoodScore: Number,
    medicationAdherenceRate: Number,
    emergencyCount: Number
  },
  
  recommendations: [String],
  concerns: [String],
  
  pdfUrl: String,            // Cloudinary
  pdfPublicId: String,
  
  status: 'draft' | 'generated' | 'reviewed' | 'sent',
  reviewedBy: ObjectId,
  sentTo: [{
    userId: ObjectId,
    sentAt: Date
  }]
}
```

---

## 🖼️ Cloudinary Configuration

### Setup Steps:

1. **Get Credentials**:
   - Go to https://cloudinary.com/console
   - Copy Cloud Name, API Key, and API Secret

2. **Update `.env` file**:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Upload File**:
   ```javascript
   const { uploadToCloudinary } = require('./config/cloudinary');
   
   const result = await uploadToCloudinary(filePath, {
     folder: 'mindbridge',
     resource_type: 'auto'
   });
   
   // result = {
   //   url: 'https://...',
   //   publicId: 'mindbridge/...',
   //   size: 12345
   // }
   ```

4. **Supported Upload Types**:
   - **Images**: JPG, PNG, GIF, WebP
   - **Documents**: PDF, DOC, DOCX
   - **Audio**: MP3, WAV (for voice messages)
   - **Videos**: MP4, WebM (for health instructions)

### File Organization:
```
mindbridge/
├── avatars/
│   └── user_id/
├── documents/
│   └── user_id/
│       ├── prescriptions/
│       ├── lab_reports/
│       └── medical_scans/
├── voice_messages/
│   └── user_id/
└── reports/
    └── user_id/
```

---

## 🔗 Relationships Between Models

```
User (1) ──→ (many) CognitiveScore
    ↓
    ├──→ (many) HealthRecord
    ├──→ (many) GameStats
    ├──→ (many) Conversation
    ├──→ (many) EmergencyLog
    ├──→ (many) Medication
    ├──→ (many) Reminder
    ├──→ (many) Appointment
    ├──→ (many) Document
    ├──→ (many) ActivityLog
    └──→ (many) Report

User (Caregiver) ──→ (many) User (Elderly)
User (Doctor) ──→ (many) Appointment
```

---

## 📊 Database Indexes

Optimized indexes for common queries:

```javascript
// User
index: { phoneNumber: 1 }, { email: 1 }, { role: 1 }

// CognitiveScore
index: { userId: 1, testDate: -1 }, { category: 1 }

// HealthRecord
index: { userId: 1, recordDate: -1 }, { 'mood.lonelinessIndex': 1 }

// GameStats
index: { userId: 1, datePlayed: -1 }, { gameName: 1 }

// Conversation
index: { userId: 1, startedAt: -1 }, { status: 1 }

// EmergencyLog
index: { userId: 1, triggeredAt: -1 }, { status: 1 }, { severity: 1 }

// Document
index: { userId: 1, type: 1 }, { uploadDate: -1 }

// ActivityLog
index: { userId: 1, timestamp: -1 }, { activityType: 1 }

// Report
index: { userId: 1, startDate: -1 }, { reportType: 1 }
```

---

## 💾 MongoDB Backup & Maintenance

### Automated Backup (Atlas):
```
Settings → Backup → Daily backup enabled
Retention: 30 days
```

### Manual Backup:
```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/mindbridge" --out ./backup
```

### Restore:
```bash
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/mindbridge" ./backup
```

---

## 🔐 Security Considerations

✅ **Implemented**:
- Password hashing (bcryptjs)
- MongoDB Atlas encryption
- Role-based access control
- Private field access in Cloudinary
- Indexes for performance

📋 **Production Checklist**:
- [ ] Enable SSL/TLS at MongoDB Atlas
- [ ] Set up rate limiting on API
- [ ] Enable audit logging
- [ ] Regular backups (daily)
- [ ] Monitor database performance
- [ ] Implement data retention policies
- [ ] GDPR compliance for user deletion

---

## 📱 Frontend-Backend Integration

### Upload Avatar:
```javascript
// Frontend
const formData = new FormData();
formData.append('file', avatarFile);

const response = await axios.post(
  `${API_BASE_URL}/user/avatar`,
  formData
);

// Backend endpoint receives and uploads to Cloudinary
```

### Fetch Health Records:
```javascript
// Frontend
const records = await axios.get(
  `${API_BASE_URL}/health/records?userId=...&days=7`
);

// Returns: [{ vitals, mood, activity, ... }]
```

### Trigger Emergency:
```javascript
// Frontend
await axios.post(`${API_BASE_URL}/alerts/sos`, {
  elderlyName: user.name,
  location: { lat, lng }
});

// Creates EmergencyLog + notifies caregivers via Twilio
```

---

**Status**: ✅ All Models Ready  
**Total Collections**: 12  
**Total Fields**: 200+  
**Indexes**: 20+  
**Last Updated**: Feb 28, 2026
