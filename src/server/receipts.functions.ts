import { createServerFn } from "@tanstack/react-start";
import {
  saveReceipt,
  loadReceipts,
  deleteReceipt,
  listFolders,
  createFolder,
  deleteFolder,
  setReceiptFolder,
} from "./receipts.server";
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

export const listFoldersFn = createServerFn({ method: "GET" }).handler(async () => {
  return listFolders();
});

export const createFolderFn = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    return createFolder(data.name);
  });

export const deleteFolderFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await deleteFolder(data.id);
    return { ok: true };
  });

export const setReceiptFolderFn = createServerFn({ method: "POST" })
  .inputValidator((data: { receiptId: string; folderId: string | null }) => data)
  .handler(async ({ data }) => {
    await setReceiptFolder(data.receiptId, data.folderId);
    return { ok: true };
  });