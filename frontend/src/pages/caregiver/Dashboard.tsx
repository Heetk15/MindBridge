import CognitiveGraph from '@/components/dashboard/CognitiveGraph';
import MoodTrend from '@/components/dashboard/MoodTrend';
import MedicationCompliance from '@/components/dashboard/MedicationCompliance';
import LonelinessIndex from '@/components/dashboard/LonelinessIndex';
import EmergencyAlerts from '@/components/dashboard/EmergencyAlerts';
import RecentConversations from '@/components/dashboard/RecentConversations';
import MBCard from '@/components/common/Card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Video, Activity, ClipboardList } from 'lucide-react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import OnlineUsersCard from '@/components/video/OnlineUsersCard';
import { motion } from 'framer-motion';

const CaregiverDashboard = () => (
  <AuthenticatedLayout>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold text-foreground mb-8">
        Caregiver Dashboard
      </motion.h1>
      <div className="grid md:grid-cols-2 gap-6">
        <MBCard elevated className="border-t-4 border-t-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground text-lg">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/caregiver/alerts">
              <Button className="w-full flex flex-col h-auto py-6 gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Video size={24} />
                <span>View Alerts</span>
              </Button>
            </Link>
            <Link to="/caregiver/tasks">
              <Button variant="outline" className="w-full flex flex-col h-auto py-6 gap-2 border-primary/20 hover:bg-primary/5">
                <ClipboardList size={24} className="text-primary" />
                <span>Manage Tasks</span>
              </Button>
            </Link>
          </div>
        </MBCard>
        <EmergencyAlerts />
        <CognitiveGraph />
        <MoodTrend />
        <MedicationCompliance />
        <LonelinessIndex />
        <RecentConversations />
        <OnlineUsersCard filterRole="elderly" />
      </div>
    </div>
  </AuthenticatedLayout>
);

export default CaregiverDashboard;
