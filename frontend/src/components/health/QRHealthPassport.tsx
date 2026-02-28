import MBCard from '@/components/common/Card';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store/authStore';

const QRHealthPassport = () => {
  const { user } = useAuthStore();

  // Construct the public passport URL pointing to the web view
  // Scanning will now open the emergency profile webpage, which contains the PDF download button
  const publicUrl = `${window.location.origin}/passport/${user?.id || 'demo'}`;

  return (
    <MBCard elevated className="flex flex-col items-center">
      <h3 className="text-xl font-display font-bold text-foreground mb-4">Health QR Code</h3>
      <div className="p-4 bg-card rounded-2xl border border-border">
        <QRCodeSVG value={publicUrl} size={200} level="H" />
      </div>
      <p className="text-sm text-muted-foreground mt-4 text-center">Scan this code for emergency medical information</p>
    </MBCard>
  );
};

export default QRHealthPassport;
