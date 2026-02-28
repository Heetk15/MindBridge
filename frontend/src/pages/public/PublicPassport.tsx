import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userService, type MedicalData } from '@/services/userService';
import MedicalInfoCard from '@/components/health/MedicalInfoCard';
import { Brain, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const PublicPassport = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MedicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const medicalInfo = await userService.getPublicPassport(id);
        setData(medicalInfo);
      } catch (err) {
        console.error('Error fetching passport:', err);
        setError('Could not load health passport. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownloadPDF = () => {
    if (!id) return;
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5004/api/v1`;
    window.open(`${apiBaseUrl}/users/passport/${id}/pdf`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Brain className="text-primary" size={28} />
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">MindBridge</h1>
            <p className="text-xs text-muted-foreground">Emergency Health Passport</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground">Loading health passport...</p>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <AlertCircle className="text-destructive" size={48} />
            <p className="text-destructive font-medium">{error}</p>
          </motion.div>
        )}

        {data && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-foreground">
                {data.name ? `${data.name}'s Health Info` : 'Health Passport'}
              </h2>
              <Button onClick={handleDownloadPDF} size="sm" className="gap-2">
                <Download size={16} />
                PDF
              </Button>
            </div>
            <MedicalInfoCard data={data} />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PublicPassport;
