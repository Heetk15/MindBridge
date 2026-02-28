import { useState, useRef } from 'react';
import MBCard from '@/components/common/Card';
import MBButton from '@/components/common/Button';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004/api';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

async function saveToKnowledgeBase(content: string, title: string, category: string): Promise<void> {
  const res = await fetch(`${API_URL}/rag/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, title, category }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save');
}

const ManageProfile = () => {
  const [medHistory, setMedHistory] = useState(['Type 2 Diabetes', 'Mild Cognitive Impairment', 'Hypertension']);
  const [medications, setMedications] = useState(['Metformin 500mg', 'Donepezil 10mg', 'Lisinopril 20mg']);
  const [newHistory, setNewHistory] = useState('');
  const [newMed, setNewMed] = useState('');

  const [historyStatus, setHistoryStatus] = useState<SaveStatus>('idle');
  const [medStatus, setMedStatus] = useState<SaveStatus>('idle');
  const [uploadStatus, setUploadStatus] = useState<SaveStatus>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddHistory = async () => {
    const item = newHistory.trim();
    if (!item) return;
    const updated = [...medHistory, item];
    setMedHistory(updated);
    setNewHistory('');
    setHistoryStatus('saving');
    try {
      await saveToKnowledgeBase(
        `Patient medical history includes: ${updated.join(', ')}.`,
        'Patient Medical History',
        'medical'
      );
      setHistoryStatus('saved');
    } catch {
      setHistoryStatus('error');
    }
    setTimeout(() => setHistoryStatus('idle'), 3000);
  };

  const handleRemoveHistory = async (item: string) => {
    const updated = medHistory.filter((x) => x !== item);
    setMedHistory(updated);
    if (updated.length > 0) {
      try {
        await saveToKnowledgeBase(
          `Patient medical history includes: ${updated.join(', ')}.`,
          'Patient Medical History',
          'medical'
        );
      } catch { /* best-effort */ }
    }
  };

  const handleAddMed = async () => {
    const item = newMed.trim();
    if (!item) return;
    const updated = [...medications, item];
    setMedications(updated);
    setNewMed('');
    setMedStatus('saving');
    try {
      await saveToKnowledgeBase(
        `Patient is currently taking the following medications: ${updated.join(', ')}.`,
        'Patient Medications',
        'medications'
      );
      setMedStatus('saved');
    } catch {
      setMedStatus('error');
    }
    setTimeout(() => setMedStatus('idle'), 3000);
  };

  const handleRemoveMed = async (item: string) => {
    const updated = medications.filter((x) => x !== item);
    setMedications(updated);
    if (updated.length > 0) {
      try {
        await saveToKnowledgeBase(
          `Patient is currently taking the following medications: ${updated.join(', ')}.`,
          'Patient Medications',
          'medications'
        );
      } catch { /* best-effort */ }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('saving');
    setUploadMsg('');
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'medical');
      const res = await fetch(`${API_URL}/rag/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadStatus('saved');
      setUploadMsg(`"${file.name}" added (${data.chunksAdded ?? '?'} sections indexed)`);
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMsg(err.message || 'Upload failed');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const StatusIcon = ({ status }: { status: SaveStatus }) => {
    if (status === 'saving') return <Loader2 size={14} className="animate-spin text-primary" />;
    if (status === 'saved')  return <CheckCircle size={14} className="text-success" />;
    if (status === 'error')  return <AlertCircle size={14} className="text-destructive" />;
    return null;
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-display font-bold text-foreground mb-2">
          Manage Patient Profile
        </motion.h1>
        <p className="text-muted-foreground mb-8">
          Information added here goes directly into the AI's knowledge base so the companion knows the patient's conditions and medications.
        </p>

        <div className="space-y-6">
          {/* Medical History */}
          <MBCard elevated>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold text-foreground">Medical History</h3>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StatusIcon status={historyStatus} />
                {historyStatus === 'saving' && 'Saving to AIâ€¦'}
                {historyStatus === 'saved'  && <span className="text-success">Saved to AI knowledge base</span>}
                {historyStatus === 'error'  && <span className="text-destructive">Save failed â€” check connection</span>}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {medHistory.map((h) => (
                <span key={h} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm flex items-center gap-2">
                  {h}
                  <button onClick={() => handleRemoveHistory(h)} className="text-primary/60 hover:text-primary">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newHistory}
                onChange={(e) => setNewHistory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHistory()}
                placeholder="Add condition..."
                className="flex-1 px-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <MBButton size="sm" onClick={handleAddHistory} disabled={!newHistory.trim() || historyStatus === 'saving'}>
                Add
              </MBButton>
            </div>
          </MBCard>

          {/* Medications */}
          <MBCard elevated>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold text-foreground">Medications</h3>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StatusIcon status={medStatus} />
                {medStatus === 'saving' && 'Saving to AIâ€¦'}
                {medStatus === 'saved'  && <span className="text-success">Saved to AI knowledge base</span>}
                {medStatus === 'error'  && <span className="text-destructive">Save failed â€” check connection</span>}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {medications.map((m) => (
                <span key={m} className="px-3 py-1 bg-success/10 text-success rounded-lg text-sm flex items-center gap-2">
                  {m}
                  <button onClick={() => handleRemoveMed(m)} className="text-success/60 hover:text-success">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newMed}
                onChange={(e) => setNewMed(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMed()}
                placeholder="Add medication..."
                className="flex-1 px-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <MBButton size="sm" onClick={handleAddMed} disabled={!newMed.trim() || medStatus === 'saving'}>
                Add
              </MBButton>
            </div>
          </MBCard>

          {/* Upload Memory Data */}
          <MBCard elevated>
            <h3 className="text-lg font-display font-semibold text-foreground mb-1">Upload Patient Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload PDFs (medical reports, discharge summaries, prescriptions) â€” they'll be indexed and made available to the AI.
            </p>
            <label
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors block ${
                uploadStatus === 'saving'
                  ? 'border-primary/50 bg-primary/5'
                  : uploadStatus === 'saved'
                  ? 'border-success/50 bg-success/5'
                  : uploadStatus === 'error'
                  ? 'border-destructive/50 bg-destructive/5'
                  : 'border-border hover:border-primary transition-colors'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileUpload} />
              {uploadStatus === 'saving' ? (
                <div className="flex flex-col items-center gap-2 text-primary">
                  <Loader2 size={32} className="animate-spin" />
                  <p className="font-medium text-sm">Uploading and indexing PDFâ€¦</p>
                </div>
              ) : uploadStatus === 'saved' ? (
                <div className="flex flex-col items-center gap-2 text-success">
                  <CheckCircle size={32} />
                  <p className="font-medium text-sm">{uploadMsg}</p>
                  <p className="text-xs opacity-70">Click to upload another</p>
                </div>
              ) : uploadStatus === 'error' ? (
                <div className="flex flex-col items-center gap-2 text-destructive">
                  <AlertCircle size={32} />
                  <p className="font-medium text-sm">{errorMsg}</p>
                  <p className="text-xs opacity-70">Click to try again</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload size={32} />
                  <p className="font-medium text-sm">Click to upload a PDF</p>
                  <p className="text-xs">Medical reports, discharge summaries, prescriptions (max 10 MB)</p>
                </div>
              )}
            </label>
          </MBCard>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default ManageProfile;
