import { Store, Calendar } from "lucide-react";
import type { ReceiptData } from "./ReceiptResult";

interface RecentReceiptsProps {
  receipts: ReceiptData[];
}

export function RecentReceipts({ receipts }: RecentReceiptsProps) {
  if (receipts.length === 0) return null;
  const fmt = (n: number) => n.toFixed(2).replace(".", ",") + " €";

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-foreground">Posledné bločky</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {receipts.map((r, i) => (
          <div key={i} className="receipt-card rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <span className="text-sm font-bold text-primary">{r.dodavatel.skratka}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{r.dodavatel.nazov}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {r.datum}
                  </div>
                </div>
              </div>
              <p className="text-lg font-bold text-primary">{fmt(r.celkom_s_dph)}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {r.dodavatel.ico && (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  IČO: {r.dodavatel.ico}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {r.polozky.length} položiek
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}