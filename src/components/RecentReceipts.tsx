import { Store, Calendar } from "lucide-react";
import type { ReceiptData } from "./ReceiptResult";

interface RecentReceiptsProps {
  receipts: ReceiptData[];
}

export function RecentReceipts({ receipts }: RecentReceiptsProps) {
  if (receipts.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-foreground">Posledné bločky</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {receipts.map((r, i) => (
          <div key={i} className="receipt-card rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{r.store}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {r.date}
                  </div>
                </div>
              </div>
              <p className="text-lg font-bold text-primary">{r.total}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                {r.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {r.items.length} položiek
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}