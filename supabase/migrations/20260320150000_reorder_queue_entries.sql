-- Batch updates the order positions of multiple queue entries.
-- This is used for drag-and-drop or move up/down reordering.
CREATE OR REPLACE FUNCTION public.reorder_queue_entries(p_updates JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_row RECORD;
BEGIN
  -- p_updates is an array of objects: [{"id": 123, "order_position": 1}, ...]
  FOR update_row IN SELECT * FROM jsonb_to_recordset(p_updates) AS x(id BIGINT, order_position INT) LOOP
    UPDATE queue_entries 
    SET order_position = update_row.order_position 
    WHERE id = update_row.id;
  END LOOP;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.reorder_queue_entries(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_queue_entries(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.reorder_queue_entries(JSONB) TO service_role;

COMMENT ON FUNCTION public.reorder_queue_entries IS 'Batch updates order_position for multiple queue entries from a JSON array.';
