import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowLeft, Search, Trash2, Download, Eye, FileText } from "lucide-react";
import { loadReceiptsFn, deleteReceiptFn } from "@/server/receipts.functions";
import type { ReceiptData } from "@/components/ReceiptResult";
import { ReceiptResult } from "@/components/ReceiptResult";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadGroupPdf, parseReceiptYearMonth, monthLabel } from "@/lib/receipt-pdf";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Archív bločkov — BločkoSken" },
      { name: "description", content: "Online archív naskenovaných bločkov pre vašu firmu." },
    ],
  }),
  component: ArchivePage,
});

type StoredReceipt = ReceiptData & { id?: string };

function downloadXmlFor(data: ReceiptData) {
  const xml = buildReceiptXml(data);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blocek_${data.datum.replace(/\./g, "-")}_${data.dodavatel.skratka}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

const xmlEsc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildReceiptXml(data: ReceiptData): string {
  const esc = xmlEsc;
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

function downloadGroupXml(items: ReceiptData[], label: string) {
  const esc = xmlEsc;
  const sumBez = items.reduce((s, r) => s + r.celkom_bez_dph, 0);
  const sumDph = items.reduce((s, r) => s + r.celkom_dph, 0);
  const sumSdph = items.reduce((s, r) => s + r.celkom_s_dph, 0);
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<Doklady obdobie="${esc(label)}" pocet="${items.length}">`);
  for (const data of items) {
    const inner = buildReceiptXml(data)
      .split("\n")
      .slice(1)
      .map((l) => "  " + l)
      .join("\n");
    lines.push(inner);
  }
  lines.push("  <Sumar>");
  lines.push(`    <CelkomBezDPH>${sumBez.toFixed(2)}</CelkomBezDPH>`);
  lines.push(`    <CelkomDPH>${sumDph.toFixed(2)}</CelkomDPH>`);
  lines.push(`    <CelkomSDPH>${sumSdph.toFixed(2)}</CelkomSDPH>`);
  lines.push("  </Sumar>");
  lines.push("</Doklady>");
  const blob = new Blob([lines.join("\n")], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeLabel = label.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
  a.download = `blocky_${safeLabel || "export"}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

function ArchivePage() {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StoredReceipt | null>(null);

  useEffect(() => {
    loadReceiptsFn()
      .then((data) => setReceipts(data as StoredReceipt[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter(
      (r) =>
        r.dodavatel.nazov.toLowerCase().includes(q) ||
        (r.dodavatel.ico ?? "").toLowerCase().includes(q) ||
        r.datum.toLowerCase().includes(q) ||
        r.polozky.some((p) => p.nazov.toLowerCase().includes(q)),
    );
  }, [receipts, query]);

  const total = filtered.reduce((s, r) => s + r.celkom_s_dph, 0);
  const fmt = (n: number) => n.toFixed(2).replace(".", ",") + " €";

  const monthGroups = useMemo(() => {
    const map = new Map<string, { label: string; items: StoredReceipt[] }>();
    for (const r of filtered) {
      const ym = parseReceiptYearMonth(r.datum);
      const key = ym ? `${ym.year}-${ym.month}` : "neznamy";
      const label = ym ? monthLabel(ym.year, ym.month) : "Neznámy dátum";
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key)!.items.push(r);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, v]) => ({ key, ...v }));
  }, [filtered]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Naozaj zmazať tento bloček z archívu?")) return;
    try {
      await deleteReceiptFn({ data: { id } });
      setReceipts((prev) => prev.filter((r) => r.id !== id));
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert("Nepodarilo sa zmazať bloček.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Archive className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Archív</h1>
              <p className="text-xs text-muted-foreground">Online archív bločkov</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Skenovať
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Bločky v archíve</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{filtered.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Celková suma</p>
            <p className="mt-1 text-2xl font-bold text-primary">{fmt(total)}</p>
          </div>
        </div>

        {!loading && monthGroups.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Hromadný export po mesiacoch</p>
              <span className="text-xs text-muted-foreground">{monthGroups.length} mesiacov</span>
            </div>
            <ul className="divide-y">
              {monthGroups.map((g) => {
                const sum = g.items.reduce((s, r) => s + r.celkom_s_dph, 0);
                return (
                  <li key={g.key} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{g.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.items.length} {g.items.length === 1 ? "doklad" : "dokladov"} · {fmt(sum)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadGroupPdf(g.items, g.label)}
                        className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        title="Stiahnuť všetky doklady mesiaca v jednom PDF"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        PDF
                      </button>
                      <button
                        onClick={() => downloadGroupXml(g.items, g.label)}
                        className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        title="Stiahnuť všetky doklady mesiaca v jednom XML pre účtovníctvo"
                      >
                        <Download className="h-3.5 w-3.5" />
                        XML
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hľadať podľa dodávateľa, IČO, dátumu, položky..."
            className="w-full rounded-lg border bg-card pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
            Načítavam archív...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {receipts.length === 0
                ? "Archív je prázdny. Naskenujte prvý bloček."
                : "Žiadne výsledky pre zadaný filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="hidden grid-cols-[1fr_120px_120px_120px_120px] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Dodávateľ</span>
              <span>Dátum</span>
              <span>IČO</span>
              <span className="text-right">Suma</span>
              <span className="text-right">Akcie</span>
            </div>
            <ul className="divide-y">
              {filtered.map((r, i) => (
                <li
                  key={r.id ?? i}
                  className="grid grid-cols-1 gap-2 px-4 py-3 hover:bg-muted/40 sm:grid-cols-[1fr_120px_120px_120px_120px] sm:items-center sm:gap-3"
                >
                  <button
                    onClick={() => setSelected(r)}
                    className="flex items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <span className="text-xs font-bold text-primary">{r.dodavatel.skratka}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.dodavatel.nazov}</p>
                      <p className="text-xs text-muted-foreground">{r.polozky.length} položiek</p>
                    </div>
                  </button>
                  <span className="text-sm text-foreground">{r.datum}</span>
                  <span className="text-xs text-muted-foreground">{r.dodavatel.ico ?? "—"}</span>
                  <span className="text-right text-sm font-bold text-foreground">{fmt(r.celkom_s_dph)}</span>
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setSelected(r)}
                      title="Zobraziť"
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => downloadXmlFor(r)}
                      title="Exportovať XML"
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {r.id && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        title="Zmazať"
                        className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail bločka</DialogTitle>
          </DialogHeader>
          {selected && (
            <ReceiptResult data={selected} onExportXml={() => downloadXmlFor(selected)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}