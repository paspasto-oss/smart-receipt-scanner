import { Check, Store, Calendar, Receipt, Tag } from "lucide-react";

export interface ReceiptData {
  store: string;
  date: string;
  total: string;
  items: { name: string; price: string }[];
  category: string;
}

interface ReceiptResultProps {
  data: ReceiptData;
}

export function ReceiptResult({ data }: ReceiptResultProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Check className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Naskenované údaje</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Store className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Obchod</p>
            <p className="font-medium text-foreground">{data.store}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Dátum</p>
            <p className="font-medium text-foreground">{data.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Celkom</p>
            <p className="text-lg font-bold text-primary">{data.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Tag className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Kategória</p>
            <p className="font-medium text-foreground">{data.category}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Položky</h4>
        <div className="space-y-2">
          {data.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
              <span className="text-sm text-foreground">{item.name}</span>
              <span className="text-sm font-semibold text-foreground">{item.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}