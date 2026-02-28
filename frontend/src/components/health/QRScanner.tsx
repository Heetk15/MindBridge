import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import MBCard from '@/components/common/Card';
import { QrCode, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScanSuccess, onClose }: QRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 280 },
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            html5QrCode
              .stop()
              .then(() => {
                onScanSuccess(decodedText);
              })
              .catch(console.error);
          },
          undefined // Error callback ignored (too noisy)
        );
        setIsStarting(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not access camera. Please check permissions.';
        console.error('Failed to start scanner:', err);
        setError(message);
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <MBCard elevated className="w-full max-w-md overflow-hidden relative border-primary/20 bg-card/95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors z-20"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        <div className="p-8 text-center">
          <div className="flex flex-col items-center gap-2 mb-8 text-primary">
            <div className="p-3 bg-primary/10 rounded-2xl mb-2">
              <QrCode size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">Scan Health QR</h2>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Point your camera at the elder's QR code to access their profile.
            </p>
          </div>

          <div className="relative aspect-square bg-black rounded-3xl overflow-hidden mb-8 shadow-2xl ring-4 ring-primary/5">
            <div id="qr-reader" className="w-full h-full" />

            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50 text-foreground gap-3">
                <RefreshCw className="animate-spin text-primary" size={32} />
                <span className="text-sm font-medium">Initializing Camera...</span>
              </div>
            )}

            {error && !isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 p-6 text-center">
                <AlertCircle className="text-destructive mb-3" size={40} />
                <p className="text-sm font-bold text-destructive mb-4">{error}</p>
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  Retry Access
                </Button>
              </div>
            )}

            {/* Scanner Frame Overlay */}
            <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-primary/50 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary -translate-x-1 -translate-y-1" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary translate-x-1 -translate-y-1" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary -translate-x-1 translate-y-1" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary translate-x-1 translate-y-1" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              className="bg-secondary/50 hover:bg-secondary text-foreground gap-2"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </MBCard>
    </div>
  );
};

export default QRScanner;
