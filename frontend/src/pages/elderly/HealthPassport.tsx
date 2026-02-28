import { useEffect, useState } from 'react';
import QRHealthPassport from '@/components/health/QRHealthPassport';
import MedicalInfoCard from '@/components/health/MedicalInfoCard';
import PanicButton from '@/components/emergency/PanicButton';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { userService, type MedicalData } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const HealthPassport = () => {
  const { user } = useAuth();
  const [data, setData] = useState<MedicalData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const medicalInfo = await userService.getPublicPassport(user.id);
        setData(medicalInfo);
      } catch (err) {
        console.error('Error fetching healthcare data:', err);
      }
    };
    fetchData();
  }, [user?.id]);

  const handleDownloadPDF = () => {
    if (!user?.id) return;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5004/api/v1`;
    window.open(`${apiBaseUrl}/users/passport/${user.id}/pdf`, '_blank');
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold text-foreground">
            Health Passport
          </motion.h1>
          <Button onClick={handleDownloadPDF} className="gap-2 bg-primary hover:bg-primary/90 shadow-lg">
            <Download size={18} />
            Download PDF Passport
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <QRHealthPassport />
          <MedicalInfoCard data={data} />
        </div>
      </div>
      <PanicButton />
    </AuthenticatedLayout>
  );
};

export default HealthPassport;
