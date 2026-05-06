CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  datum TEXT NOT NULL,
  dodavatel_nazov TEXT NOT NULL,
  dodavatel_skratka TEXT NOT NULL DEFAULT '',
  dodavatel_ico TEXT,
  polozky JSONB NOT NULL DEFAULT '[]'::jsonb,
  celkom_bez_dph NUMERIC NOT NULL DEFAULT 0,
  celkom_dph NUMERIC NOT NULL DEFAULT 0,
  celkom_s_dph NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read receipts" ON public.receipts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert receipts" ON public.receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete receipts" ON public.receipts FOR DELETE USING (true);