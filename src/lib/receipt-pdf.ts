import { jsPDF } from "jspdf";
import type { ReceiptData } from "@/components/ReceiptResult";

export function downloadGroupPdf(receipts: ReceiptData[], groupLabel: string) {
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

// Parse "DD.MM.YYYY" or "YYYY-MM-DD" -> {year, month}
export function parseReceiptYearMonth(datum: string): { year: string; month: string } | null {
  const dotMatch = datum.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
  if (dotMatch) return { year: dotMatch[3], month: dotMatch[2].padStart(2, "0") };
  const isoMatch = datum.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return { year: isoMatch[1], month: isoMatch[2] };
  return null;
}

const MONTH_NAMES_SK = [
  "Január", "Február", "Marec", "Apríl", "Máj", "Jún",
  "Júl", "August", "September", "Október", "November", "December",
];

export function monthLabel(year: string, month: string): string {
  const idx = parseInt(month, 10) - 1;
  const name = idx >= 0 && idx < 12 ? MONTH_NAMES_SK[idx] : month;
  return `${name} ${year}`;
}