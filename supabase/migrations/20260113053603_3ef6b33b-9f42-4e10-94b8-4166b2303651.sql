-- Make the expediente-documentos bucket public so images can be viewed
UPDATE storage.buckets
SET public = true
WHERE id = 'expediente-documentos';