const API_KEY = process.env.LOVABLE_API_KEY!;
const URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function analyzeReceiptImage(base64Image: string, mimeType: string) {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Si expert na čítanie slovenských a českých účteniek/bločkov. Extrahuj z obrázku tieto údaje vo formáte JSON:
{
  "datum": "DD.MM.YYYY",
  "dodavatel": {
    "nazov": "Celý názov dodávateľa/obchodu",
    "skratka": "Skratka/iniciály (max 3 znaky)",
    "ico": "IČO ak je na bločku"
  },
  "polozky": [
    {
      "nazov": "Názov položky",
      "cenaBezDph": 0.00,
      "sadzba_dph": 20,
      "cenaSdph": 0.00
    }
  ],
  "celkom_bez_dph": 0.00,
  "celkom_dph": 0.00,
  "celkom_s_dph": 0.00
}
Ak nejaký údaj nie je na bločku, použi null. Ceny sú v EUR. Ak sú ceny len s DPH, dopočítaj cenu bez DPH podľa sadzby (20% alebo 10%). Vždy vráť platný JSON.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyzuj tento bloček a extrahuj všetky údaje:" },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI Gateway error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}