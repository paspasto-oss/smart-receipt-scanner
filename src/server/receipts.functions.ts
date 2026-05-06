import { createServerFn } from "@tanstack/react-start";
import { saveReceipt, loadReceipts, deleteReceipt } from "./receipts.server";
import type { ReceiptData } from "@/components/ReceiptResult";

export const saveReceiptFn = createServerFn({ method: "POST" })
  .inputValidator((data: ReceiptData) => data)
  .handler(async ({ data }) => {
    return saveReceipt(data);
  });

export const loadReceiptsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    return loadReceipts();
  });

export const deleteReceiptFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await deleteReceipt(data.id);
    return { ok: true };
  });