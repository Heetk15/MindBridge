import CognitiveGraph from '@/components/dashboard/CognitiveGraph';
import MoodTrend from '@/components/dashboard/MoodTrend';
import MedicationCompliance from '@/components/dashboard/MedicationCompliance';
import LonelinessIndex from '@/components/dashboard/LonelinessIndex';
import EmergencyAlerts from '@/components/dashboard/EmergencyAlerts';
import RecentConversations from '@/components/dashboard/RecentConversations';
import MBCard from '@/components/common/Card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Video, 
  Activity, 
  QrCode, 
  Bell, 
  Heart, 
  Brain, 
  Clock,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import OnlineUsersCard from '@/components/video/OnlineUsersCard';
import { motion, Variants } from 'framer-motion';
import { useState, useEffect } from 'react';
import QRScanner from '@/components/health/QRScanner';
import { DashboardCard } from '@/components/dashboard/DashboardCard';

// Types for variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};


const CaregiverDashboard = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alerts, setAlerts] = useState(3);
  const navigate = useNavigate();

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    try {
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      const passportIndex = pathParts.indexOf('passport');
      if (passportIndex !== -1 && pathParts[passportIndex + 1]) {
        navigate(`/passport/${pathParts[passportIndex + 1]}`);
        return;
      }
    } catch (e) {
      if (decodedText.length > 5) {
        navigate(`/passport/${decodedText}`);
      } else {
        alert("Invalid QR code format. Please scan a valid Health Passport.");
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Welcome and Real-time Clock */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">
                Welcome back, Sarah
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg flex items-center gap-2">
                <Clock size={18} className="inline" />
                {formatTime(currentTime)} • {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* Quick Stats Summary with Pulse Animation */}
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border border-slate-200 dark:border-slate-700">
              <motion.div 
                className="flex items-center gap-3"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Heart className="text-emerald-600 dark:text-emerald-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Under Care</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">1 elder</p>
                </div>
              </motion.div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Bell className="text-amber-600 dark:text-amber-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active Alerts</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{alerts}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Quick Actions Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Quick Actions" 
              icon={<Activity size={24} />}
              iconBgColor="bg-indigo-100 dark:bg-indigo-900/30"
              iconColor="text-indigo-600 dark:text-indigo-400"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/caregiver/alerts">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg shadow-indigo-500/25"
                    >
                      <Bell size={24} className="mb-2" />
                      <p className="font-semibold">View Alerts</p>
                      <p className="text-xs text-indigo-100 mt-1">{alerts} new</p>
                    </motion.div>
                  </Link>

                  <motion.button
                    onClick={() => setIsScannerOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-700 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-indigo-600 dark:text-indigo-400 text-left w-full"
                  >
                    <QrCode size={24} className="mb-2" />
                    <p className="font-semibold">Scan QR</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Health passport</p>
                  </motion.button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-slate-600 dark:text-slate-300">Recent Activity</span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-xs">View all →</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-slate-600 dark:text-slate-300">Medication taken - Margaret</span>
                      <span className="text-xs text-slate-400 ml-auto">5m ago</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle size={14} className="text-blue-500" />
                      <span className="text-slate-600 dark:text-slate-300">AI Companion session - Robert</span>
                      <span className="text-xs text-slate-400 ml-auto">25m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </motion.div>

          {/* Emergency Alerts Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Emergency Alerts" 
              icon={<AlertCircle size={24} />}
              iconBgColor="bg-red-100 dark:bg-red-900/30"
              iconColor="text-red-600 dark:text-red-400"
            >
              <EmergencyAlerts />
            </DashboardCard>
          </motion.div>

          {/* Cognitive Graph Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Cognitive Health" 
              icon={<Brain size={24} />}
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
              iconColor="text-purple-600 dark:text-purple-400"
              action={<span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">+8%</span>}
            >
              <CognitiveGraph />
            </DashboardCard>
          </motion.div>

          {/* Mood Trend Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Mood Trends" 
              icon={<Heart size={24} />}
              iconBgColor="bg-pink-100 dark:bg-pink-900/30"
              iconColor="text-pink-600 dark:text-pink-400"
            >
              <MoodTrend />
            </DashboardCard>
          </motion.div>

          {/* Medication Compliance Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Medication Compliance" 
              icon={<CheckCircle size={24} />}
              iconBgColor="bg-green-100 dark:bg-green-900/30"
              iconColor="text-green-600 dark:text-green-400"
              action={<span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">92%</span>}
            >
              <MedicationCompliance />
            </DashboardCard>
          </motion.div>

          {/* Loneliness Index Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Loneliness Index" 
              icon={<Users size={24} />}
              iconBgColor="bg-orange-100 dark:bg-orange-900/30"
              iconColor="text-orange-600 dark:text-orange-400"
            >
              <LonelinessIndex />
            </DashboardCard>
          </motion.div>

          {/* Recent Conversations Card */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-1">
            <DashboardCard 
              title="Recent Conversations" 
              icon={<MessageCircle size={24} />}
              iconBgColor="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
            >
              <RecentConversations />
            </DashboardCard>
          </motion.div>

          {/* Online Users Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Online Elders" 
              icon={<Video size={24} />}
              iconBgColor="bg-teal-100 dark:bg-teal-900/30"
              iconColor="text-teal-600 dark:text-teal-400"
            >
              <OnlineUsersCard filterRole="elderly" />
            </DashboardCard>
          </motion.div>

          {/* Weekly Insights Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Weekly Insights" 
              icon={<TrendingUp size={24} />}
              iconBgColor="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Cognitive Score</span>
                    <span className="font-semibold text-purple-600">78%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '78%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-purple-500 h-2 rounded-full"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Social Engagement</span>
                    <span className="font-semibold text-green-600">92%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="bg-green-500 h-2 rounded-full"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-900 dark:text-white">Tip:</span> Margaret has shown improved mood this week. Great job!
                  </p>
                </div>
              </div>
            </DashboardCard>
          </motion.div>

          {/* Today's Schedule Card */}
          <motion.div variants={itemVariants}>
            <DashboardCard 
              title="Today's Schedule" 
              icon={<Calendar size={24} />}
              iconBgColor="bg-cyan-100 dark:bg-cyan-900/30"
              iconColor="text-cyan-600 dark:text-cyan-400"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">10:30</div>
                  <div>
                    <p className="font-medium text-sm">Medication - Margaret</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">In 30 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">14:00</div>
                  <div>
                    <p className="font-medium text-sm">Video Call - Robert</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Check-in call</p>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </motion.div>
        </motion.div>

        {/* QR Scanner Modal */}
        {isScannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onClose={() => setIsScannerOpen(false)}
            />
          </motion.div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default CaregiverDashboard;
