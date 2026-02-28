import { useGeofenceAlertStore, type GeofenceAlertData } from '@/store/geofenceAlertStore';
import { getSocket } from '@/services/socketService';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, MapPin, CheckCircle, XCircle, ExternalLink, Clock,
} from 'lucide-react';

// ── Single alert card ────────────────────────────────────────────────────────

const AlertCard = ({ alert }: { alert: GeofenceAlertData }) => {
  const { acknowledgeAlert, ignoreAlert } = useGeofenceAlertStore();
  const user = useAuthStore((s) => s.user);

  const handleAcknowledge = () => {
    acknowledgeAlert(alert.alertId);
    const socket = getSocket();
    socket.emit('geofence:acknowledge', {
      alertId: alert.alertId,
      userId: alert.userId,
      caregiverId: user?.id || 'unknown',
    });
  };

  const handleIgnore = () => {
    ignoreAlert(alert.alertId);
    const socket = getSocket();
    socket.emit('geofence:ignore', {
      alertId: alert.alertId,
      userId: alert.userId,
      caregiverId: user?.id || 'unknown',
    });
  };

  const mapsUrl = `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`;
  const timeStr = new Date(alert.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative overflow-hidden rounded-xl border border-destructive/40 bg-destructive/5 backdrop-blur-md shadow-lg"
    >
      {/* Animated red pulse accent */}
      <div className="absolute inset-y-0 left-0 w-1 bg-destructive animate-pulse" />

      <div className="p-4 pl-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/15">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">
                Geofence Breach — {alert.patientName}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock size={11} />
                {timeStr}
              </p>
            </div>
          </div>

          {/* Map link */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
          >
            <ExternalLink size={12} />
            View on Map
          </a>
        </div>

        {/* Details row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-destructive" />
            {alert.distance} m away (limit: {alert.safeRadius} m)
          </span>
          <span>
            {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleAcknowledge}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <CheckCircle size={14} />
            Acknowledge
          </button>
          <button
            onClick={handleIgnore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <XCircle size={14} />
            Ignore
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main banner component (renders all active alerts) ────────────────────────

const GeofenceAlertBanner = () => {
  const alerts = useGeofenceAlertStore((s) => s.alerts);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-14 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <AlertCard key={alert.alertId} alert={alert} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GeofenceAlertBanner;
