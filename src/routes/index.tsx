import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { UploadZone } from "@/components/UploadZone";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { ReceiptResult, type ReceiptData } from "@/components/ReceiptResult";
import { RecentReceipts } from "@/components/RecentReceipts";
import { Receipt, TrendingUp, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const MOCK_RESULT: ReceiptData = {
  store: "Lidl Bratislava",
  date: "03.05.2026",
  total: "24,87 €",
  category: "Potraviny",
  items: [
    { name: "Chlieb celozrnný", price: "1,49 €" },
    { name: "Mlieko polotučné 1l", price: "0,99 €" },
    { name: "Kuracie prsia 500g", price: "4,99 €" },
    { name: "Paradajky 1kg", price: "2,49 €" },
    { name: "Jogurt biely 150g", price: "0,69 €" },
    { name: "Cestoviny penne 500g", price: "1,29 €" },
    { name: "Olivový olej 500ml", price: "5,99 €" },
    { name: "Banány 1kg", price: "1,49 €" },
    { name: "Maslo 250g", price: "2,89 €" },
    { name: "Minerálka 1.5l", price: "0,56 €" },
  ],
};

function Index() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReceiptData | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptData[]>([
    {
      store: "Tesco Košice",
      date: "01.05.2026",
      total: "18,45 €",
      category: "Potraviny",
      items: [
        { name: "Rohlík", price: "0,15 €" },
        { name: "Syra", price: "3,49 €" },
        { name: "Jablká 1kg", price: "1,99 €" },
      ],
    },
    {
      store: "DM drogéria",
      date: "29.04.2026",
      total: "32,10 €",
      category: "Drogéria",
      items: [
        { name: "Šampón", price: "4,99 €" },
        { name: "Zubná pasta", price: "2,49 €" },
      ],
    },
    {
      store: "Kaufland",
      date: "27.04.2026",
      total: "56,78 €",
      category: "Potraviny",
      items: [
        { name: "Víno", price: "6,99 €" },
        { name: "Syr eidam", price: "2,99 €" },
        { name: "Šunka", price: "3,49 €" },
      ],
    },
  ]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setResult(null);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setScanning(true);

    // Simulate scanning
    setTimeout(() => {
      setScanning(false);
      setResult(MOCK_RESULT);
      setRecentReceipts((prev) => [MOCK_RESULT, ...prev]);
    }, 2500);
  }, []);

  const handleRemove = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setSelectedFile(null);
    setImageUrl(null);
    setResult(null);
    setScanning(false);
  };

  const totalSpent = recentReceipts.reduce((sum, r) => {
    const num = parseFloat(r.total.replace(",", ".").replace(" €", ""));
    return sum + num;
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
              <ReceiptResult data={result} />
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
