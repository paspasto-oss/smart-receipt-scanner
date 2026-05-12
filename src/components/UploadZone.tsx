import { useState, useCallback, useRef } from "react";
import { Camera, Upload, FileImage } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // reset so the same file can be chosen again
    e.target.value = "";
  };

  const openPicker = (capture: boolean) => {
    const input = fileInputRef.current;
    if (!input) return;
    if (capture) input.setAttribute("capture", "environment");
    else input.removeAttribute("capture");
    input.click();
  };

  return (
    <div
      className={`upload-zone flex flex-col items-center justify-center gap-4 p-10 ${dragOver ? "drag-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
        <Camera className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">Nahrajte bloček</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Pretiahnite obrázok sem alebo kliknite pre výber
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={() => openPicker(false)}
        >
          <Upload className="h-4 w-4" />
          Nahrať súbor
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          onClick={() => openPicker(true)}
        >
          <FileImage className="h-4 w-4" />
          Odfotiť
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}