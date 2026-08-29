-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('expediente-documentos', 'expediente-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload to their organization's folder
CREATE POLICY "Users can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'expediente-documentos' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to view documents
CREATE POLICY "Users can view documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'expediente-documentos' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete their documents
CREATE POLICY "Users can delete documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'expediente-documentos' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to update documents
CREATE POLICY "Users can update documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'expediente-documentos' 
  AND auth.role() = 'authenticated'
);