
-- Add content_preview column for decryption fallback
ALTER TABLE public.encrypted_messages ADD COLUMN IF NOT EXISTS content_preview text;

-- Deactivate all old keys, keep only the latest per user
WITH ranked_keys AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.e2e_key_pairs
  WHERE is_active = true
)
UPDATE public.e2e_key_pairs
SET is_active = false
WHERE id IN (SELECT id FROM ranked_keys WHERE rn > 1);
