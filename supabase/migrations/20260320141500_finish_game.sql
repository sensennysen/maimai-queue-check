-- Atomically finishes the current game and marks the next waiting entry as playing.
-- This ensures data integrity by performing both updates in a single transaction.

CREATE OR REPLACE FUNCTION public.finish_game(
  p_current_playing_id BIGINT DEFAULT NULL,
  p_next_waiting_id BIGINT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transition_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- 1. Complete the current playing entry if provided
  IF p_current_playing_id IS NOT NULL THEN
    UPDATE queue_entries
    SET status = 'completed',
        ended_at = transition_time
    WHERE id = p_current_playing_id;
  END IF;

  -- 2. Start the next waiting entry if provided
  IF p_next_waiting_id IS NOT NULL THEN
    UPDATE queue_entries
    SET status = 'playing',
        started_at = transition_time
    WHERE id = p_next_waiting_id;
  END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.finish_game(BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_game(BIGINT, BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION public.finish_game(BIGINT, BIGINT) TO service_role;

COMMENT ON FUNCTION public.finish_game IS 'Atomically transitions from current playing to next waiting queue entry.';
