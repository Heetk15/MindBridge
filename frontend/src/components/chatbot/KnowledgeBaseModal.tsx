import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUpload, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api'

interface Props {
  isOpen: boolean
  onClose: () => void
}

type Tab = 'text' | 'pdf'
type Status = 'idle' | 'loading' | 'success' | 'error'

export default function KnowledgeBaseModal({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('text')

  // Text tab state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('personal')
  const [textContent, setTextContent] = useState('')

  // PDF tab state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfCategory, setPdfCategory] = useState('personal')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const categories = [
    { value: 'personal', label: '👤 Personal Info' },
    { value: 'medical', label: '🏥 Medical' },
    { value: 'family-info', label: '👨‍👩‍👧 Family' },
    { value: 'exercises', label: '🏃 Exercises' },
    { value: 'medications', label: '💊 Medications' },
    { value: 'user-uploads', label: '📁 General' },
  ]

  const resetState = () => {
    setStatus('idle')
    setMessage('')
  }

  const handleTextSubmit = async () => {
    if (!textContent.trim() || textContent.trim().length < 10) {
      setStatus('error')
      setMessage('Please enter at least 10 characters of content.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch(`${API_URL}/rag/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textContent, title: title || 'My Note', category }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setStatus('success')
      setMessage(`✓ Added to knowledge base (${data.chunksAdded} chunks indexed)`)
      setTitle('')
      setTextContent('')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Something went wrong')
    }
  }

  const handlePdfSubmit = async () => {
    if (!pdfFile) {
      setStatus('error')
      setMessage('Please select a PDF file.')
      return
    }

    setStatus('loading')
    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      formData.append('category', pdfCategory)

      const res = await fetch(`${API_URL}/rag/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setStatus('success')
      setMessage(`✓ "${pdfFile.name}" added (${data.pages} pages, ${data.chunksAdded} chunks indexed)`)
      setPdfFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Something went wrong')
    }
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Add to Knowledge Base</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Add personal info so your AI companion knows you better
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-secondary rounded-xl transition-all text-muted-foreground hover:text-foreground"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-2 mx-6 mt-4 bg-secondary/50 rounded-xl">
                <button
                  onClick={() => { setTab('text'); resetState() }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    tab === 'text'
                      ? 'bg-card text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FiFileText size={16} />
                  Type Text
                </button>
                <button
                  onClick={() => { setTab('pdf'); resetState() }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    tab === 'pdf'
                      ? 'bg-card text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FiUpload size={16} />
                  Upload PDF
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {tab === 'text' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. My Daily Routine"
                          className="w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                        >
                          {categories.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Content</label>
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Type any information you want the AI to remember about you — family members, medical history, preferences, daily routines, etc."
                        rows={6}
                        className="w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{textContent.length} characters</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                      <select
                        value={pdfCategory}
                        onChange={(e) => setPdfCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                      >
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        pdfFile
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setPdfFile(file)
                          resetState()
                        }}
                      />
                      {pdfFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-2xl">📄</div>
                          <p className="font-medium text-foreground text-sm">{pdfFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024).toFixed(1)} KB — click to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground text-2xl">📂</div>
                          <p className="font-medium text-foreground text-sm">Drop PDF here or click to browse</p>
                          <p className="text-xs text-muted-foreground">Max 10MB — medical reports, prescriptions, notes</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status message */}
                <AnimatePresence>
                  {status !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                        status === 'success'
                          ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                          : status === 'error'
                          ? 'bg-destructive/10 text-destructive border border-destructive/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {status === 'loading' && (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                      )}
                      {status === 'success' && <FiCheckCircle size={16} className="shrink-0" />}
                      {status === 'error' && <FiAlertCircle size={16} className="shrink-0" />}
                      <span>{status === 'loading' ? 'Adding to knowledge base...' : message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 pb-6">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={tab === 'text' ? handleTextSubmit : handlePdfSubmit}
                  disabled={status === 'loading'}
                  className="px-6 py-2.5 text-sm font-bold gradient-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {status === 'loading' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiUpload size={15} />
                  )}
                  {status === 'loading' ? 'Adding...' : 'Add to Knowledge Base'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
