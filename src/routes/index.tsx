import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { UploadZone } from "@/components/UploadZone";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { ReceiptResult, type ReceiptData } from "@/components/ReceiptResult";
import { RecentReceipts } from "@/components/RecentReceipts";
import { Receipt, TrendingUp, BarChart3, AlertCircle } from "lucide-react";
import { scanReceipt } from "@/server/receipt-ocr.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

function receiptToXml(data: ReceiptData): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push("<Doklad>");
  lines.push(`  <Datum>${esc(data.datum)}</Datum>`);
  lines.push("  <Dodavatel>");
  lines.push(`    <Nazov>${esc(data.dodavatel.nazov)}</Nazov>`);
  lines.push(`    <Skratka>${esc(data.dodavatel.skratka)}</Skratka>`);
  lines.push(`    <ICO>${data.dodavatel.ico ? esc(data.dodavatel.ico) : ""}</ICO>`);
  lines.push("  </Dodavatel>");
  lines.push("  <Polozky>");
  for (const p of data.polozky) {
    lines.push("    <Polozka>");
    lines.push(`      <Nazov>${esc(p.nazov)}</Nazov>`);
    lines.push(`      <CenaBezDPH>${p.cenaBezDph.toFixed(2)}</CenaBezDPH>`);
    lines.push(`      <SadzbaDPH>${p.sadzba_dph}</SadzbaDPH>`);
    lines.push(`      <CenaSDPH>${p.cenaSdph.toFixed(2)}</CenaSDPH>`);
    lines.push("    </Polozka>");
  }
  lines.push("  </Polozky>");
  lines.push(`  <CelkomBezDPH>${data.celkom_bez_dph.toFixed(2)}</CelkomBezDPH>`);
  lines.push(`  <CelkomDPH>${data.celkom_dph.toFixed(2)}</CelkomDPH>`);
  lines.push(`  <CelkomSDPH>${data.celkom_s_dph.toFixed(2)}</CelkomSDPH>`);
  lines.push("</Doklad>");
  return lines.join("\n");
}

function downloadXml(data: ReceiptData) {
  const xml = receiptToXml(data);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blocek_${data.datum.replace(/\./g, "-")}_${data.dodavatel.skratka}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Index() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptData[]>([]);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setScanning(true);

    try {
      const base64 = await fileToBase64(file);
      const data = await scanReceipt({
        data: { base64Image: base64, mimeType: file.type || "image/jpeg" },
      });
      setScanning(false);
      setResult(data as ReceiptData);
      setRecentReceipts((prev) => [data as ReceiptData, ...prev]);
    } catch (err) {
      setScanning(false);
      setError(err instanceof Error ? err.message : "Chyba pri skenovaní");
    }
  }, []);

  const handleRemove = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setSelectedFile(null);
    setImageUrl(null);
    setResult(null);
    setError(null);
    setScanning(false);
  };

  const totalSpent = recentReceipts.reduce((sum, r) => {
    return sum + r.celkom_s_dph;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">BločkoSken</h1>
              <p className="text-xs text-muted-foreground">Skener bločkov</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt className="h-4 w-4" />
              <span className="text-xs font-medium">Bločky celkom</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">{recentReceipts.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Celkové výdavky</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-primary">
              {totalSpent.toFixed(2).replace(".", ",")} €
            </p>
          </div>
          <div className="hidden rounded-xl border bg-card p-4 sm:block">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">Tento mesiac</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {totalSpent.toFixed(2).replace(".", ",")} €
            </p>
          </div>
        </div>

        {/* Upload / Preview / Result */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            {!imageUrl ? (
              <UploadZone onFileSelect={handleFileSelect} />
            ) : (
              <ReceiptPreview
                imageUrl={imageUrl}
                scanning={scanning}
                onRemove={handleRemove}
              />
            )}
          </div>
          <div>
            {result ? (
              <ReceiptResult data={result} onExportXml={() => downloadXml(result)} />
            ) : error ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-10">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-destructive/60" />
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                  <button
                    onClick={handleRemove}
                    className="mt-3 text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Skúsiť znova
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-muted/30 p-10">
                <div className="text-center">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Nahrajte bloček a údaje sa zobrazia tu
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent receipts */}
        <RecentReceipts receipts={recentReceipts} />
      </main>
    </div>
  );
}
