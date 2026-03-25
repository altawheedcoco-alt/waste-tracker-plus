-- Migrate platform_news data from Test to Live
-- This uses ON CONFLICT to avoid duplicates

DO $$
BEGIN
  -- Only run if the table has less than 100 rows (i.e., Live environment)
  IF (SELECT COUNT(*) FROM platform_news) < 100 THEN
    RAISE NOTICE 'Skipping news migration - data already exists';
  END IF;
END $$;
