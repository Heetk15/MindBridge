import MBCard from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';
import { User, Phone, Pill, FileText } from 'lucide-react';
import type { MedicalData } from '@/services/userService';

interface MedicalInfoCardProps {
  data?: MedicalData | null;
}

const MedicalInfoCard = ({ data }: MedicalInfoCardProps) => {
  const { user } = useAuth();

  // Use data if provided (from public view or specific fetch), otherwise fallback to auth user
  const displayData = data || (user as unknown as MedicalData);

  return (
    <MBCard elevated>
      <h3 className="text-xl font-display font-bold text-foreground mb-4">Medical Information</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <User className="text-primary mt-1" size={20} />
          <div>
            <p className="text-sm text-muted-foreground">Patient</p>
            <p className="font-semibold text-foreground">{displayData?.name || 'Margaret Johnson'}, Age {displayData?.age || 78}</p>
          </div>
        </div>

        {displayData?.medications && displayData.medications.length > 0 && (
          <div className="flex items-start gap-3">
            <Pill className="text-primary mt-1" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Medications</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {displayData.medications.map((m, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary text-sm rounded-lg">
                    {typeof m === 'string' ? m : `${m.name} ${m.dosage}`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {displayData?.medicalHistory && displayData.medicalHistory.length > 0 && (
          <div className="flex items-start gap-3">
            <FileText className="text-primary mt-1" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Medical History</p>
              <ul className="text-foreground text-sm mt-1 space-y-1">
                {displayData.medicalHistory.map((h, idx) => (
                  <li key={idx}>• {h}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {displayData?.emergencyContacts && displayData.emergencyContacts.length > 0 && (
          <div className="flex items-start gap-3">
            <Phone className="text-primary mt-1" size={20} />
            <div>
              <p className="text-sm text-muted-foreground">Emergency Contacts</p>
              {displayData.emergencyContacts.map((c, idx) => (
                <p key={idx} className="text-foreground text-sm">{c.name} ({c.relationship}) — {c.phone}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </MBCard>
  );
};

export default MedicalInfoCard;
