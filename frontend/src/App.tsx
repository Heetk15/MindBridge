import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import DebugLogin from './pages/public/DebugLogin';
import ForgotPassword from './pages/public/ForgotPassword';
import PublicPassport from './pages/public/PublicPassport';
import ElderlyDashboard from './pages/elderly/Dashboard';
import ElderlyChat from './pages/elderly/Chat';
import ElderlyGames from './pages/elderly/Games';
import ElderlyHealthPassport from './pages/elderly/HealthPassport';
import ElderlyVideoCall from './pages/elderly/VideoCall';
import ElderlySupport from './pages/elderly/Support';
import CaregiverDashboard from './pages/caregiver/Dashboard';
import CaregiverConversations from './pages/caregiver/Conversations';
import CaregiverAlerts from './pages/caregiver/Alerts';
import CaregiverManageProfile from './pages/caregiver/ManageProfile';
import CaregiverLocationMonitor from './pages/caregiver/LocationMonitor';
import CaregiverVideoCall from './pages/caregiver/VideoCall';
import CaregiverTasks from './pages/caregiver/Tasks';
import CognitiveProgress from './pages/caregiver/CognitiveProgress';
import ProtectedRoute from './components/layout/ProtectedRoute';
import NotFound from './pages/NotFound';
import IncomingCallModal from './components/video/IncomingCallModal';
import OutgoingCallModal from './components/video/OutgoingCallModal';
import GeofenceAlertBanner from './components/emergency/GeofenceAlertBanner';
import { useCallSignaling } from './hooks/useCallSignaling';
import { useCallStore } from './store/callStore';
import { useAuthStore } from './store/authStore';

/** Inner component that has access to router + manages call signaling */
const AppShell = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Initialize socket signaling (registers user online, listens for calls)
  useCallSignaling();

  const { callStatus, activeRoomName } = useCallStore();

  // When a call is accepted, navigate to the video call page
  useEffect(() => {
    if (callStatus === 'accepted' && activeRoomName && user) {
      const role = user.role; // 'elderly' or 'caregiver'
      navigate(`/${role}/video-call/${activeRoomName}`);
    }
  }, [callStatus, activeRoomName, user, navigate]);

  return (
    <>
      {/* Global call modals — shown on any page */}
      <IncomingCallModal />
      <OutgoingCallModal />
      {/* Geofence breach alerts — floating cards for caregivers */}
      <GeofenceAlertBanner />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/debug-login" element={<DebugLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/passport/:id" element={<PublicPassport />} />

        {/* Elderly */}
        <Route path="/elderly/dashboard" element={<ProtectedRoute role="elderly"><ElderlyDashboard /></ProtectedRoute>} />
        <Route path="/elderly/chat" element={<ProtectedRoute role="elderly"><ElderlyChat /></ProtectedRoute>} />
        <Route path="/elderly/games" element={<ProtectedRoute role="elderly"><ElderlyGames /></ProtectedRoute>} />
        <Route path="/elderly/health-passport" element={<ProtectedRoute role="elderly"><ElderlyHealthPassport /></ProtectedRoute>} />
        <Route path="/elderly/video-call/:id" element={<ProtectedRoute role="elderly"><ElderlyVideoCall /></ProtectedRoute>} />
        <Route path="/elderly/support" element={<ProtectedRoute role="elderly"><ElderlySupport /></ProtectedRoute>} />

        {/* Caregiver */}
        <Route path="/caregiver/dashboard" element={<ProtectedRoute role="caregiver"><CaregiverDashboard /></ProtectedRoute>} />
        <Route path="/caregiver/conversations" element={<ProtectedRoute role="caregiver"><CaregiverConversations /></ProtectedRoute>} />
        <Route path="/caregiver/alerts" element={<ProtectedRoute role="caregiver"><CaregiverAlerts /></ProtectedRoute>} />
        <Route path="/caregiver/location" element={<ProtectedRoute role="caregiver"><CaregiverLocationMonitor /></ProtectedRoute>} />
        <Route path="/caregiver/manage-profile" element={<ProtectedRoute role="caregiver"><CaregiverManageProfile /></ProtectedRoute>} />
        <Route path="/caregiver/tasks" element={<ProtectedRoute role="caregiver"><CaregiverTasks /></ProtectedRoute>} />
        <Route path="/caregiver/cognitive" element={<ProtectedRoute role="caregiver"><CognitiveProgress /></ProtectedRoute>} />
        <Route path="/caregiver/video-call/:id" element={<ProtectedRoute role="caregiver"><CaregiverVideoCall /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;
