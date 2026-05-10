import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { UploadZone } from "@/components/UploadZone";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { ReceiptResult, type ReceiptData } from "@/components/ReceiptResult";
import { RecentReceipts } from "@/components/RecentReceipts";
import { Receipt, TrendingUp, BarChart3, AlertCircle, Archive } from "lucide-react";
import { scanReceipt } from "@/server/receipt-ocr.functions";
import { saveReceiptFn, loadReceiptsFn } from "@/server/receipts.functions";
import { downloadGroupPdf } from "@/lib/receipt-pdf";

export const Route = createFileRoute("/")({
  component: Index,
});

function receiptToXml(data: ReceiptData): string {
  return receiptToXmlBlock(data);
}

function receiptsToXml(receipts: ReceiptData[]): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push("<Doklady>");
  for (const data of receipts) {
    lines.push(receiptToXmlBlock(data, "  "));
  }
  lines.push("</Doklady>");
  return lines.join("\n");
}

function receiptToXmlBlock(data: ReceiptData, indent = ""): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines: string[] = [];
  lines.push(`${indent}<Doklad>`);
  lines.push(`${indent}  <Datum>${esc(data.datum)}</Datum>`);
  lines.push(`${indent}  <Dodavatel>`);
  lines.push(`${indent}    <Nazov>${esc(data.dodavatel.nazov)}</Nazov>`);
  lines.push(`${indent}    <Skratka>${esc(data.dodavatel.skratka)}</Skratka>`);
  lines.push(`${indent}    <ICO>${data.dodavatel.ico ? esc(data.dodavatel.ico) : ""}</ICO>`);
  lines.push(`${indent}  </Dodavatel>`);
  lines.push(`${indent}  <Polozky>`);
  for (const p of data.polozky) {
    lines.push(`${indent}    <Polozka>`);
    lines.push(`${indent}      <Nazov>${esc(p.nazov)}</Nazov>`);
    lines.push(`${indent}      <CenaBezDPH>${p.cenaBezDph.toFixed(2)}</CenaBezDPH>`);
    lines.push(`${indent}      <SadzbaDPH>${p.sadzba_dph}</SadzbaDPH>`);
    lines.push(`${indent}      <CenaSDPH>${p.cenaSdph.toFixed(2)}</CenaSDPH>`);
    lines.push(`${indent}    </Polozka>`);
  }
  lines.push(`${indent}  </Polozky>`);
  lines.push(`${indent}  <CelkomBezDPH>${data.celkom_bez_dph.toFixed(2)}</CelkomBezDPH>`);
  lines.push(`${indent}  <CelkomDPH>${data.celkom_dph.toFixed(2)}</CelkomDPH>`);
  lines.push(`${indent}  <CelkomSDPH>${data.celkom_s_dph.toFixed(2)}</CelkomSDPH>`);
  lines.push(`${indent}</Doklad>`);
  return lines.join("\n");
}

function downloadXml(data: ReceiptData) {
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + receiptToXmlBlock(data);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blocek_${data.datum.replace(/\./g, "-")}_${data.dodavatel.skratka}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadGroupXml(receipts: ReceiptData[], groupLabel: string) {
  const xml = receiptsToXml(receipts);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blocky_${groupLabel.replace(/[^a-zA-Z0-9]/g, "_")}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadGroupPdf(receipts: ReceiptData[], groupLabel: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Blocky - ${groupLabel}`, marginL, y);
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Pocet dokladov: ${receipts.length}`, marginL, y);
  y += 4;
  const totalAll = receipts.reduce((s, r) => s + r.celkom_s_dph, 0);
  doc.text(`Celkom s DPH: ${totalAll.toFixed(2)} EUR`, marginL, y);
  y += 10;

  receipts.forEach((r, idx) => {
    addPageIfNeeded(50);

    // Receipt header
    doc.setDrawColor(200);
    doc.setFillColor(245, 245, 245);
    doc.rect(marginL, y - 4, contentW, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${r.dodavatel.nazov}`, marginL + 2, y + 1);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(r.datum, pageW - marginR - 2, y + 1, { align: "right" });
    y += 8;

    if (r.dodavatel.ico) {
      doc.text(`ICO: ${r.dodavatel.ico}`, marginL + 2, y + 1);
      y += 5;
    }

    // Items table header
    addPageIfNeeded(15);
    y += 2;
    doc.setFillColor(230, 230, 230);
    doc.rect(marginL, y - 3, contentW, 6, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Nazov", marginL + 2, y + 1);
    doc.text("Bez DPH", marginL + 100, y + 1, { align: "right" });
    doc.text("DPH %", marginL + 125, y + 1, { align: "right" });
    doc.text("S DPH", marginL + contentW - 2, y + 1, { align: "right" });
    y += 6;

    doc.setFont("helvetica", "normal");
    for (const p of r.polozky) {
      addPageIfNeeded(6);
      const name = p.nazov.length > 45 ? p.nazov.substring(0, 42) + "..." : p.nazov;
      doc.text(name, marginL + 2, y + 1);
      doc.text(p.cenaBezDph.toFixed(2), marginL + 100, y + 1, { align: "right" });
      doc.text(`${p.sadzba_dph}%`, marginL + 125, y + 1, { align: "right" });
      doc.text(p.cenaSdph.toFixed(2), marginL + contentW - 2, y + 1, { align: "right" });
      y += 5;
    }

    // Totals
    addPageIfNeeded(12);
    y += 1;
    doc.setDrawColor(180);
    doc.line(marginL, y, marginL + contentW, y);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Celkom bez DPH:", marginL + 80, y, { align: "right" });
    doc.text(`${r.celkom_bez_dph.toFixed(2)} EUR`, marginL + contentW - 2, y, { align: "right" });
    y += 4;
    doc.text("DPH:", marginL + 80, y, { align: "right" });
    doc.text(`${r.celkom_dph.toFixed(2)} EUR`, marginL + contentW - 2, y, { align: "right" });
    y += 4;
    doc.setFontSize(10);
    doc.text("Celkom s DPH:", marginL + 80, y, { align: "right" });
    doc.text(`${r.celkom_s_dph.toFixed(2)} EUR`, marginL + contentW - 2, y, { align: "right" });
    y += 10;
  });

  doc.save(`blocky_${groupLabel.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
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

  useEffect(() => {
    loadReceiptsFn().then((data) => setRecentReceipts(data)).catch(console.error);
  }, []);

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
      // Save to database
      try {
        await saveReceiptFn({ data: data as ReceiptData });
        // Reload from DB to get ID and stay in sync
        const fresh = await loadReceiptsFn();
        setRecentReceipts(fresh);
      } catch (saveErr) {
        console.error("Failed to save receipt:", saveErr);
        setRecentReceipts((prev) => [data as ReceiptData, ...prev]);
      }
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
          <Link
            to="/archive"
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Archive className="h-4 w-4" />
            Archív
          </Link>
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
              <div className="space-y-3">
                <ReceiptResult data={result} onExportXml={() => downloadXml(result)} />
                <button
                  onClick={handleRemove}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Receipt className="h-4 w-4" />
                  Nový doklad
                </button>
              </div>
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
        <RecentReceipts
          receipts={recentReceipts}
          onExportGroup={downloadGroupXml}
          onExportGroupPdf={downloadGroupPdf}
        />
      </main>
    </div>
  );
}
