-- Fix: add 'anon_key' alias in app_config so the trigger can find it
-- The trigger references key='anon_key' but the table only has 'supabase_anon_key'
INSERT INTO app_config (key, value)
SELECT 'anon_key', value FROM app_config WHERE key = 'supabase_anon_key'
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;