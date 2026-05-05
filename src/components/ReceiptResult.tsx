import { Check, Store, Calendar, Receipt, Tag, Building2, Download } from "lucide-react";

export interface ReceiptData {
  datum: string;
  dodavatel: {
    nazov: string;
    skratka: string;
    ico: string | null;
  };
  polozky: {
    nazov: string;
    cenaBezDph: number;
    sadzba_dph: number;
    cenaSdph: number;
  }[];
  celkom_bez_dph: number;
  celkom_dph: number;
  celkom_s_dph: number;
}

interface ReceiptResultProps {
  data: ReceiptData;
  onExportXml?: () => void;
}

export function ReceiptResult({ data, onExportXml }: ReceiptResultProps) {
  const fmt = (n: number) => n.toFixed(2).replace(".", ",") + " €";

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <Check className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Naskenované údaje</h3>
        </div>
        {onExportXml && (
          <button
            onClick={onExportXml}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" />
            XML Export
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Store className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Dodávateľ</p>
            <p className="font-medium text-foreground">{data.dodavatel.nazov}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Dátum</p>
            <p className="font-medium text-foreground">{data.datum}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">IČO</p>
            <p className="font-medium text-foreground">{data.dodavatel.ico ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Celkom s DPH</p>
            <p className="text-lg font-bold text-primary">{fmt(data.celkom_s_dph)}</p>
          </div>
        </div>
      </div>

      {/* VAT Summary */}
      <div className="mb-5 rounded-lg border p-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Základ bez DPH</span>
          <span className="font-medium text-foreground">{fmt(data.celkom_bez_dph)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">DPH</span>
          <span className="font-medium text-foreground">{fmt(data.celkom_dph)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t pt-1.5">
          <span className="text-foreground">Celkom s DPH</span>
          <span className="text-primary">{fmt(data.celkom_s_dph)}</span>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Položky</h4>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1 text-xs text-muted-foreground font-medium">
            <span>Názov</span>
            <span className="w-20 text-right">Bez DPH</span>
            <span className="w-14 text-right">DPH %</span>
            <span className="w-20 text-right">S DPH</span>
          </div>
          {data.polozky.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center rounded-lg border px-3 py-2">
              <span className="text-sm text-foreground">{item.nazov}</span>
              <span className="w-20 text-right text-sm text-muted-foreground">{fmt(item.cenaBezDph)}</span>
              <span className="w-14 text-right text-xs text-muted-foreground">{item.sadzba_dph}%</span>
              <span className="w-20 text-right text-sm font-semibold text-foreground">{fmt(item.cenaSdph)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}