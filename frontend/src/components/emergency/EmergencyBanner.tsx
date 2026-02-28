import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertTriangle, FiX, FiPhone, FiCheck } from 'react-icons/fi'
import type { EmergencyData } from '@/store/chatStore'

const SEVERITY_CONFIG = {
  LEVEL_3: {
    bg: 'bg-red-600',
    border: 'border-red-500',
    text: 'text-white',
    badge: 'bg-red-800 text-red-100',
    label: '🚨 CRITICAL EMERGENCY',
    pulse: true,
  },
  LEVEL_2: {
    bg: 'bg-orange-500',
    border: 'border-orange-400',
    text: 'text-white',
    badge: 'bg-orange-700 text-orange-100',
    label: '⚠️ Possible Emergency',
    pulse: false,
  },
  LEVEL_1: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-400',
    text: 'text-yellow-950',
    badge: 'bg-yellow-700 text-yellow-100',
    label: '🟡 Mild Concern',
    pulse: false,
  },
}

interface EmergencyBannerProps {
  emergency: EmergencyData
  onDismiss: () => void
  /** Call this when user confirms "Yes, notify caregiver" */
  onConfirm?: () => void
  /** Call this when user cancels "No, I'm fine" */
  onCancel?: () => void
}

export default function EmergencyBanner({
  emergency,
  onDismiss,
  onConfirm,
  onCancel,
}: EmergencyBannerProps) {
  const [loading, setLoading] = useState(false)
  const config = SEVERITY_CONFIG[emergency.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.LEVEL_2

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm?.()
    setLoading(false)
  }

  const handleCancel = async () => {
    setLoading(true)
    await onCancel?.()
    setLoading(false)
  }

  const needsConfirmation = emergency.action === 'confirm' && !emergency.telegramSent
  const alreadySent       = emergency.telegramSent

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className={`relative rounded-2xl border-2 ${config.bg} ${config.border} ${config.text} p-5 shadow-2xl overflow-hidden`}
        role="alert"
        aria-live="assertive"
      >
        {/* Pulse ring for LEVEL_3 */}
        {config.pulse && (
          <span className="absolute inset-0 rounded-2xl border-4 border-red-300 opacity-30 animate-ping pointer-events-none" />
        )}

        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-xl ${config.badge} shrink-0`}>
              <FiAlertTriangle size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base leading-tight">{config.label}</p>
              {emergency.matchedKeywords?.length > 0 && (
                <p className="text-xs opacity-80 mt-0.5 truncate">
                  Detected: {emergency.matchedKeywords.join(' · ')}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Dismiss"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body message */}
        {emergency.confirmationMessage && (
          <p className="mt-3 text-sm leading-relaxed opacity-95 whitespace-pre-wrap">
            {emergency.confirmationMessage}
          </p>
        )}

        {/* Telegram sent confirmation */}
        {alreadySent && (
          <div className="mt-3 flex items-center gap-2 text-sm font-medium opacity-95">
            <FiCheck size={16} />
            <span>Caregiver has been notified via Telegram.</span>
          </div>
        )}

        {/* Action buttons */}
        {needsConfirmation && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-red-700 font-bold text-sm rounded-xl hover:bg-red-50 transition-all disabled:opacity-50 shadow-sm"
            >
              <FiPhone size={16} />
              Yes, notify them
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-black/20 font-semibold text-sm rounded-xl hover:bg-black/30 transition-all disabled:opacity-50"
            >
              No, I'm okay
            </button>
          </div>
        )}

        {/* Risk score chip */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badge} uppercase tracking-wider`}>
            Risk score: {emergency.score}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
