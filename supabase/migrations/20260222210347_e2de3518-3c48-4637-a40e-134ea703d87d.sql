
-- Remove the plaintext hmac_secret column from paymob_config
-- The HMAC secret is already securely stored as an environment variable (PAYMOB_HMAC_SECRET)
-- and used directly in the paymob-webhook edge function via Deno.env.get()
ALTER TABLE public.paymob_config DROP COLUMN IF EXISTS hmac_secret;
