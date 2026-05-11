import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ReceiptData } from "@/components/ReceiptResult";

export async function saveReceipt(data: ReceiptData) {
  const { data: row, error } = await supabaseAdmin
    .from("receipts")
    .insert({
      datum: data.datum,
      dodavatel_nazov: data.dodavatel.nazov,
      dodavatel_skratka: data.dodavatel.skratka,
      dodavatel_ico: data.dodavatel.ico,
      polozky: data.polozky as any,
      celkom_bez_dph: data.celkom_bez_dph,
      celkom_dph: data.celkom_dph,
      celkom_s_dph: data.celkom_s_dph,
      image_url: data.image_url ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return row;
}

export async function loadReceipts(): Promise<(ReceiptData & { id: string })[]> {
  const { data, error } = await supabaseAdmin
    .from("receipts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    datum: r.datum,
    dodavatel: {
      nazov: r.dodavatel_nazov,
      skratka: r.dodavatel_skratka,
      ico: r.dodavatel_ico,
    },
    polozky: (r.polozky as any[]) ?? [],
    celkom_bez_dph: Number(r.celkom_bez_dph),
    celkom_dph: Number(r.celkom_dph),
    celkom_s_dph: Number(r.celkom_s_dph),
    image_url: r.image_url ?? null,
  }));
}

export async function deleteReceipt(id: string) {
  const { error } = await supabaseAdmin
    .from("receipts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}