import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeReceiptImage } from "./receipt-ocr.server";

export const scanReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        base64Image: z.string(),
        mimeType: z.string(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const result = await analyzeReceiptImage(data.base64Image, data.mimeType);
    return result;
  });