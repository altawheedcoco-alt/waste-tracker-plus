
-- Auto-update reactions_count and reactions_summary on broadcast_post_reactions changes
CREATE OR REPLACE FUNCTION update_broadcast_reactions_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  UPDATE broadcast_posts
  SET 
    reactions_count = (SELECT count(*) FROM broadcast_post_reactions WHERE post_id = target_post_id),
    reactions_summary = (
      SELECT COALESCE(
        jsonb_object_agg(reaction_type, cnt),
        '{}'::jsonb
      )
      FROM (
        SELECT reaction_type, count(*) as cnt
        FROM broadcast_post_reactions
        WHERE post_id = target_post_id
        GROUP BY reaction_type
      ) sub
    )
  WHERE id = target_post_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_broadcast_reactions ON broadcast_post_reactions;
CREATE TRIGGER trg_broadcast_reactions
  AFTER INSERT OR DELETE ON broadcast_post_reactions
  FOR EACH ROW EXECUTE FUNCTION update_broadcast_reactions_count();
