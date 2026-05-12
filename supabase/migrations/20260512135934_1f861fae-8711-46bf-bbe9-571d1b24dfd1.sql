CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read folders" ON public.folders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert folders" ON public.folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete folders" ON public.folders FOR DELETE USING (true);

ALTER TABLE public.receipts ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

CREATE POLICY "Anyone can update receipts" ON public.receipts FOR UPDATE USING (true) WITH CHECK (true);