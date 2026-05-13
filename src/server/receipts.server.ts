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
    folder_id: (r as any).folder_id ?? null,
  }));
}

export async function deleteReceipt(id: string) {
  const { error } = await supabaseAdmin
    .from("receipts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listFolders() {
  const { data, error } = await supabaseAdmin
    .from("folders")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createFolder(name: string) {
  const { data, error } = await supabaseAdmin
    .from("folders")
    .insert({ name })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFolder(id: string) {
  const { error } = await supabaseAdmin.from("folders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function renameFolder(id: string, name: string) {
  const { data, error } = await supabaseAdmin
    .from("folders")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setReceiptFolder(receiptId: string, folderId: string | null) {
  const { error } = await supabaseAdmin
    .from("receipts")
    .update({ folder_id: folderId })
    .eq("id", receiptId);
  if (error) throw new Error(error.message);
}