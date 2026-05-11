
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Receipts images are publicly readable" ON storage.objects;
CREATE POLICY "Receipts images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Anyone can upload receipt images" ON storage.objects;
CREATE POLICY "Anyone can upload receipt images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Anyone can delete receipt images" ON storage.objects;
CREATE POLICY "Anyone can delete receipt images"
ON storage.objects FOR DELETE
USING (bucket_id = 'receipts');
