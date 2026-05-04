import { X, Loader2 } from "lucide-react";

interface ReceiptPreviewProps {
  imageUrl: string;
  scanning: boolean;
  onRemove: () => void;
}

export function ReceiptPreview({ imageUrl, scanning, onRemove }: ReceiptPreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card">
      <button
        onClick={onRemove}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/80 text-card transition-colors hover:bg-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <img
        src={imageUrl}
        alt="Nahraný bloček"
        className="max-h-[400px] w-full object-contain"
      />
      {scanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Skenujem bloček...</p>
          </div>
        </div>
      )}
    </div>
  );
}