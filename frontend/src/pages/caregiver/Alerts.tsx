import { useEffect, useState, useCallback } from 'react';
import MBCard from '@/components/common/Card';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, RefreshCw, Phone, Send,
  MapPin, Tag, Clock, ShieldAlert, Loader2,
} from 'lucide-react';
import { getAlerts, resolveAlert } from '@/services/emergencyService';
import type { DBAlert } from '@/types/emergency.types';

// ── helpers ──────────────────────────────────────────────────────────────────

const ALERT_TYPE_LABEL: Record<string, string> = {
  panic_button:   'Panic Button',
  fall_detected:  'Fall Detected',
  inactivity:     'Inactivity',
  distress_phrase:'Distress Phrase',
  unusual_vitals: 'Unusual Vitals',
  medication_missed: 'Missed Medication',
  other:          'Other',
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-destructive/20 text-destructive border border-destructive/30',
  high:     'bg-orange-500/20 text-orange-400 border border-orange-400/30',
  medium:   'bg-warning/20 text-warning border border-warning/30',
  low:      'bg-secondary text-muted-foreground border border-border',
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ── component ─────────────────────────────────────────────────────────────────

const Alerts = () => {
  const [alerts, setAlerts]     = useState<DBAlert[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<'all' | 'active' | 'resolved'>('all');
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts({ limit: 100 });
      setAlerts(data.alerts);
    } catch (err: any) {
      setError(err?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleResolve = async (id: string, falseAlarm = false) => {
    setResolving(id);
    try {
      await resolveAlert(id, { falseAlarm });
      setAlerts(prev =>
        prev.map(a =>
          a.id === id
            ? { ...a, resolved: true, status: falseAlarm ? 'false_alarm' : 'resolved' }
            : a
        )
      );
    } catch {
      // silently ignore; refetch to sync state
      await fetchAlerts();
    } finally {
      setResolving(null);
    }
  };

  const visible = alerts.filter(a => {
    if (filter === 'active')   return !a.resolved;
    if (filter === 'resolved') return a.resolved;
    return true;
  });

  const activeCount = alerts.filter(a => !a.resolved).length;

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Emergency Alerts</h1>
            {!loading && (
              <p className="text-muted-foreground mt-1">
                {activeCount > 0
                  ? <span className="text-destructive font-medium">{activeCount} active alert{activeCount !== 1 ? 's' : ''}</span>
                  : 'No active alerts'}
                {alerts.length > 0 && ` · ${alerts.length} total`}
              </p>
            )}
          </div>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {f}
              {f === 'active' && activeCount > 0 && (
                <span className="ml-1.5 bg-destructive text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Loader2 size={36} className="animate-spin" />
            <p>Loading alerts…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <ShieldAlert size={40} className="text-destructive/60" />
            <p className="text-destructive">{error}</p>
            <button onClick={fetchAlerts} className="text-sm underline">Try again</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <CheckCircle size={40} className="text-success/60" />
            <p>{filter === 'all' ? 'No alerts recorded yet.' : `No ${filter} alerts.`}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-3">
              {visible.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <MBCard elevated>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-xl flex-shrink-0 ${a.resolved ? 'bg-success/10' : 'bg-destructive/10'}`}>
                        {a.resolved
                          ? <CheckCircle className="text-success" size={22} />
                          : <AlertTriangle className="text-destructive" size={22} />}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-foreground text-sm">
                            {ALERT_TYPE_LABEL[a.alertType] ?? a.alertType}
                          </h3>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.low}`}>
                            {a.severity}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            a.resolved ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                          }`}>
                            {a.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-muted-foreground italic line-clamp-2 mb-2">
                          "{a.message}"
                        </p>

                        {/* Keywords */}
                        {a.keywords && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                            <Tag size={12} />
                            <span>{a.keywords}</span>
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(a.triggeredAt)}
                          </span>
                          {a.resolvedAt && (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle size={12} />
                              Resolved {formatTime(a.resolvedAt)}
                            </span>
                          )}
                          {a.emergencyServicesNotified && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <Send size={12} />
                              Telegram sent
                            </span>
                          )}
                          {a.ambulanceRequested && (
                            <span className="flex items-center gap-1 text-orange-400">
                              <Phone size={12} />
                              Call placed
                            </span>
                          )}
                          {a.location?.latitude && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {a.location.address
                                ? a.location.address
                                : `${a.location.latitude?.toFixed(4)}, ${a.location.longitude?.toFixed(4)}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Resolve actions */}
                      {!a.resolved && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleResolve(a.id, false)}
                            disabled={resolving === a.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-success/15 text-success hover:bg-success/25 font-medium transition-colors disabled:opacity-50"
                          >
                            {resolving === a.id ? '…' : 'Resolve'}
                          </button>
                          <button
                            onClick={() => handleResolve(a.id, true)}
                            disabled={resolving === a.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 font-medium transition-colors disabled:opacity-50"
                          >
                            False alarm
                          </button>
                        </div>
                      )}
                    </div>
                  </MBCard>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default Alerts;

