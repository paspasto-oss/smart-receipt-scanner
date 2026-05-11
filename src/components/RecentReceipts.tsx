import { Calendar, CalendarDays, CalendarRange, ChevronDown, ChevronRight, Download, Trash2 } from "lucide-react";
import type { ReceiptData } from "./ReceiptResult";
import { useState, useMemo } from "react";
import { FileText } from "lucide-react";

interface RecentReceiptsProps {
  receipts: (ReceiptData & { id?: string })[];
  onExportGroup?: (receipts: ReceiptData[], groupLabel: string) => void;
  onExportGroupPdf?: (receipts: ReceiptData[], groupLabel: string) => void;
  onDelete?: (id: string) => void;
}

type GroupMode = "day" | "month" | "year";

function parseDate(datum: string): Date {
  // Supports DD.MM.YYYY or YYYY-MM-DD
  const dotParts = datum.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotParts) return new Date(+dotParts[3], +dotParts[2] - 1, +dotParts[1]);
  return new Date(datum);
}

function groupKey(datum: string, mode: GroupMode): string {
  const d = parseDate(datum);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (mode === "year") return `${yyyy}`;
  if (mode === "month") return `${yyyy}-${mm}`;
  return `${yyyy}-${mm}-${dd}`;
}

function formatGroupLabel(key: string, mode: GroupMode): string {
  if (mode === "year") return key;
  if (mode === "month") {
    const [y, m] = key.split("-");
    const months = ["Január","Február","Marec","Apríl","Máj","Jún","Júl","August","September","Október","November","December"];
    return `${months[+m - 1]} ${y}`;
  }
  const [y, m, d] = key.split("-");
  return `${+d}.${+m}.${y}`;
}

export function RecentReceipts({ receipts, onExportGroup, onExportGroupPdf, onDelete }: RecentReceiptsProps) {
  if (receipts.length === 0) return null;
  const fmt = (n: number) => n.toFixed(2).replace(".", ",") + " €";
  const [mode, setMode] = useState<GroupMode>("day");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  type R = ReceiptData & { id?: string };
  const groups = useMemo(() => {
    const map = new Map<string, R[]>();
    for (const r of receipts) {
      const k = groupKey(r.datum, mode);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [receipts, mode]);

  const toggleGroup = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const modes: { value: GroupMode; label: string; icon: React.ReactNode }[] = [
    { value: "day", label: "Dni", icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: "month", label: "Mesiace", icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { value: "year", label: "Roky", icon: <CalendarRange className="h-3.5 w-3.5" /> },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Posledné bločky</h2>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {groups.map(([key, items]) => {
          const isCollapsed = collapsed[key];
          const groupTotal = items.reduce((s, r) => s + r.celkom_s_dph, 0);
          return (
            <div key={key} className="rounded-xl border bg-card overflow-hidden">
              <button
                onClick={() => toggleGroup(key)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-foreground">
                    {formatGroupLabel(key, mode)}
                  </span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    {items.length} {items.length === 1 ? "bloček" : items.length < 5 ? "bločky" : "bločkov"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">{fmt(groupTotal)}</span>
                </div>
              </button>
              {onExportGroup && (
                <div className="flex justify-end gap-2 px-4 pb-2 -mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportGroup(items, formatGroupLabel(key, mode));
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportovať XML
                  </button>
                  {onExportGroupPdf && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportGroupPdf(items, formatGroupLabel(key, mode));
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Exportovať PDF
                    </button>
                  )}
                </div>
              )}
              {!isCollapsed && (
                <div className="border-t divide-y">
                  {items.map((r, i) => (
                    <div key={r.id ?? i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                          <span className="text-xs font-bold text-primary">{r.dodavatel.skratka}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{r.dodavatel.nazov}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{r.datum}</span>
                            {r.dodavatel.ico && <span>IČO: {r.dodavatel.ico}</span>}
                            <span>{r.polozky.length} položiek</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-foreground">{fmt(r.celkom_s_dph)}</p>
                        {onDelete && r.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Naozaj zmazať tento bloček?")) onDelete(r.id!);
                            }}
                            title="Zmazať bloček"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}