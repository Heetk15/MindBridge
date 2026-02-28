import { useState, useEffect } from 'react'
import { FiMic, FiMicOff } from 'react-icons/fi'
import useVoiceRecorder from '../../hooks/useVoiceRecorder'

function VoiceRecorder({ onTranscript, onAudioData, onSendMessage, disabled = false }) {
  const {
    isRecording,
    transcript,
    error,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscript,
  } = useVoiceRecorder()

  const [displayTranscript, setDisplayTranscript] = useState('')
  const [recordingComplete, setRecordingComplete] = useState(false)
  const [audioVisualization, setAudioVisualization] = useState([])

  useEffect(() => {
    setDisplayTranscript(transcript)
    // When transcript is captured and recording is done, mark as complete
    if (transcript && !isRecording) {
      setRecordingComplete(true)
    }
  }, [transcript, isRecording])

  const handleStartRecording = async () => {
    setDisplayTranscript('')
    setRecordingComplete(false)
    await startRecording()
  }

  const handleStopRecording = async () => {
    await stopRecording()
    // Don't manually set recordingComplete here - let the useEffect handle it
  }

  const handleSendTranscript = () => {
    if (displayTranscript.trim()) {
      // If onSendMessage is provided, use it to send directly
      if (onSendMessage) {
        onSendMessage(displayTranscript)
      } else {
        // Otherwise, just pass the transcript back
        onTranscript?.(displayTranscript)
      }
      setRecordingComplete(false)
      setDisplayTranscript('')
    }
  }

  const handleCancel = () => {
    cancelRecording()
    clearTranscript()
    setDisplayTranscript('')
    setRecordingComplete(false)
  }

  return (
    <div className="space-y-3">
      {/* Visualization */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 h-12 bg-red-50 rounded-lg p-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-red-500 to-red-300 rounded-full"
              style={{
                height: `${Math.random() * 30 + 4}px`,
                animation: `pulse 0.6s ease-in-out ${i * 0.05}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Transcript Display */}
      {displayTranscript && (
        <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-primary-500">
          <p className="text-sm text-gray-700">{displayTranscript}</p>
          {isRecording && (
            <p className="text-xs text-gray-500 mt-2">
              🎤 Listening... (click done to finish)
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isRecording ? (
          recordingComplete && displayTranscript ? (
            <>
              <button
                onClick={handleSendTranscript}
                disabled={disabled}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                ✓ Send Message
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xl font-bold"
              >
                ×
              </button>
            </>
          ) : (
            <button
              onClick={handleStartRecording}
              disabled={disabled || isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <FiMic size={18} />
              Start Recording
            </button>
          )
        ) : (
          <>
            <button
              onClick={handleStopRecording}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              ✓ {isProcessing ? 'Processing...' : 'Done'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xl font-bold"
            >
              ×
            </button>
          </>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        {isRecording
          ? '🎤 Recording... Speak naturally'
          : recordingComplete && displayTranscript
            ? '✅ Review your message and click Send'
            : '💬 Click the microphone button to start recording'}
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default VoiceRecorder