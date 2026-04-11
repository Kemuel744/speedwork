import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (productId: string) => void;
}

export default function QRScanner({ open, onClose, onScan }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>('qr-reader-' + Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!open) return;

    let stopped = false;
    const startScanner = async () => {
      try {
        setError(null);
        const scanner = new Html5Qrcode(containerRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (stopped) return;
            // Parse QR data - expects JSON with product id
            try {
              const data = JSON.parse(decodedText);
              if (data.id) {
                onScan(data.id);
              }
            } catch {
              // Try as plain product ID
              onScan(decodedText);
            }
          },
          () => {} // ignore errors during scanning
        );
      } catch (err: any) {
        setError(err?.message || "Impossible d'accéder à la caméra");
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 300);

    return () => {
      stopped = true;
      clearTimeout(timer);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [open, onScan]);

  const handleClose = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Scanner un QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            id={containerRef.current}
            className="w-full rounded-lg overflow-hidden bg-muted min-h-[280px]"
          />
          {error && (
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground">
                Vérifiez que votre navigateur a accès à la caméra
              </p>
            </div>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Pointez la caméra vers le QR code d'un produit
          </p>
          <Button variant="outline" className="w-full" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
