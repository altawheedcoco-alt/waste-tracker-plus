
-- Add linked_shipment_id to notes table for linking notes to shipments
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS linked_shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL;

-- Add linked_shipment_ids to chat_messages for shipment mentions in chat
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS linked_shipment_ids uuid[] DEFAULT '{}';

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_linked_shipment_id ON public.notes(linked_shipment_id) WHERE linked_shipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_linked_shipments ON public.chat_messages USING GIN(linked_shipment_ids) WHERE linked_shipment_ids != '{}';
