const API_KEY = process.env.LOVABLE_API_KEY!;
const URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const TOLERANCE = 0.05; // 5 centov tolerancia pre súčty

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!m) return null;
  let [_, d, mo, y] = m;
  let year = parseInt(y, 10);
  if (year < 100) year += 2000;
  const date = new Date(year, parseInt(mo, 10) - 1, parseInt(d, 10));
  if (isNaN(date.getTime())) return null;
  return date;
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function validateAndCorrect(parsed: any): { data: any; warnings: string[] } {
  const warnings: string[] = [];

  // --- Dátum: kontrola rozumnosti roku ---
  const today = new Date();
  const currentYear = today.getFullYear();
  const date = parseDate(parsed.datum);
  if (date) {
    const y = date.getFullYear();
    // Bloček nemôže byť z budúcnosti (viac ako 1 deň dopredu)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date > tomorrow) {
      warnings.push(`Dátum ${parsed.datum} je v budúcnosti — skontrolujte rok.`);
    }
    // Pravdepodobná OCR chyba: rok je viac ako 5 rokov v minulosti
    if (y < currentYear - 5) {
      warnings.push(
        `Dátum ${parsed.datum} je viac ako 5 rokov starý — možná OCR chyba (napr. ${y} namiesto ${currentYear}).`
      );
    }
    // Ak rok dáva nezmysel (napr. 1900, 9999), nahraď za null
    if (y < 2000 || y > currentYear + 1) {
      warnings.push(`Neplatný rok ${y} v dátume — vymazané.`);
      parsed.datum = null;
    }
  } else if (parsed.datum) {
    warnings.push(`Dátum "${parsed.datum}" má nesprávny formát.`);
    parsed.datum = null;
  }

  // --- Súčet položiek vs. celková suma ---
  if (Array.isArray(parsed.polozky) && parsed.polozky.length > 0) {
    const sumSdph = parsed.polozky.reduce(
      (acc: number, p: any) => acc + (Number(p?.cenaSdph) || 0),
      0
    );
    const celkom = Number(parsed.celkom_s_dph) || 0;
    if (celkom > 0 && Math.abs(sumSdph - celkom) > TOLERANCE) {
      warnings.push(
        `Súčet položiek (${sumSdph.toFixed(2)} €) sa nezhoduje s celkovou sumou (${celkom.toFixed(2)} €).`
      );
    }

    // Dopočítanie cenaBezDph ak chýba
    for (const p of parsed.polozky) {
      const sadzba = Number(p?.sadzba_dph) || 20;
      const sdph = Number(p?.cenaSdph);
      const bezdph = Number(p?.cenaBezDph);
      if (Number.isFinite(sdph) && !Number.isFinite(bezdph)) {
        p.cenaBezDph = +(sdph / (1 + sadzba / 100)).toFixed(2);
      } else if (Number.isFinite(bezdph) && !Number.isFinite(sdph)) {
        p.cenaSdph = +(bezdph * (1 + sadzba / 100)).toFixed(2);
      }
    }
  }

  // --- DPH konzistencia: bez_dph + dph ≈ s_dph ---
  const bez = Number(parsed.celkom_bez_dph);
  const dph = Number(parsed.celkom_dph);
  const s = Number(parsed.celkom_s_dph);
  if (Number.isFinite(bez) && Number.isFinite(dph) && Number.isFinite(s)) {
    if (Math.abs(bez + dph - s) > TOLERANCE) {
      warnings.push(
        `DPH súčty nesedia: ${bez.toFixed(2)} + ${dph.toFixed(2)} ≠ ${s.toFixed(2)}.`
      );
    }
  }

  return { data: parsed, warnings };
}

export async function analyzeReceiptImage(base64Image: string, mimeType: string) {
  const today = new Date();
  const todayStr = formatDate(today);

  const response = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "system",
          content: `Si expert na čítanie slovenských a českých účteniek/bločkov. Dnešný dátum je ${todayStr}. Extrahuj z obrázku tieto údaje vo formáte JSON:
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
  "celkom_s_dph": 0.00,
  "confidence": {
    "datum": "high|medium|low",
    "celkom": "high|medium|low"
  }
}

DÔLEŽITÉ KONTROLY:
1. DÁTUM: Bloček je z minulosti alebo dneška — NIKDY z ďalekej budúcnosti. Ak vidíš nejasný rok, uprednostni ${today.getFullYear()} alebo ${today.getFullYear() - 1} pred starými rokmi (2020-2023). Pri neistote (rozmazaný posledný znak) skús viac variantov a vyber ten najbližšie k dnešnému dátumu (${todayStr}). Označ confidence.datum = "low" ak nie si si istý.
2. ČÍSLA: Skontroluj, či súčet položiek sa rovná celkovej sume. Ak nie, pozri sa znova na nejasné cifry. Často sa zamieňa: 0↔6, 0↔8, 1↔7, 3↔8, 5↔6, 5↔S, B↔8.
3. Pre slabo čitateľné bločky využi kontext (názvy položiek typické pre daný obchod, bežné ceny) na overenie čísel.
4. Ak nejaký údaj nie je na bločku, použi null. Ceny sú v EUR. Ak sú ceny len s DPH, dopočítaj cenu bez DPH podľa sadzby (20% alebo 10%).
5. Vždy vráť platný JSON.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyzuj tento bloček a extrahuj všetky údaje. Buď obzvlášť opatrný pri dátume (rok!) a celkovej sume. Dnes je ${todayStr}.`,
            },
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
  const parsed = JSON.parse(content);
  const { data: corrected, warnings } = validateAndCorrect(parsed);
  corrected.warnings = warnings;
  return corrected;
}