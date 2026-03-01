-- Allow users to delete their own action locks (for rollback on failure)
CREATE POLICY "Users can delete own action logs"
  ON public.action_execution_log FOR DELETE
  USING (auth.uid() = user_id);