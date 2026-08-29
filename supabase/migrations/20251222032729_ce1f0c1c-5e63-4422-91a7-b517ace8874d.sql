-- Fix mutable search_path on get_user_role(uuid) function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role::text 
  FROM public.profiles 
  WHERE user_id = user_uuid;
$function$;

-- Fix mutable search_path on has_role(uuid, text) function
CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = user_uuid 
    AND role::text = required_role
  )
$function$;

-- Fix mutable search_path on match_documents function
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector, 
  match_count integer DEFAULT NULL::integer, 
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$function$;