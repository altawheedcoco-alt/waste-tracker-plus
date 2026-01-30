-- Drop existing policies and recreate with optimized function calls
DROP POLICY IF EXISTS "Users can view notes for their organization" ON partner_notes;
DROP POLICY IF EXISTS "Users can create notes from their organization" ON partner_notes;
DROP POLICY IF EXISTS "Receivers can update notes to mark as read" ON partner_notes;
DROP POLICY IF EXISTS "Senders can delete their notes" ON partner_notes;

-- Recreate policies using the safe function to avoid potential issues
CREATE POLICY "Users can view notes for their organization" 
ON partner_notes FOR SELECT 
USING (
  sender_organization_id = get_user_org_id_safe(auth.uid()) 
  OR receiver_organization_id = get_user_org_id_safe(auth.uid())
);

CREATE POLICY "Users can create notes from their organization" 
ON partner_notes FOR INSERT 
WITH CHECK (
  sender_organization_id = get_user_org_id_safe(auth.uid())
);

CREATE POLICY "Receivers can update notes to mark as read" 
ON partner_notes FOR UPDATE 
USING (
  receiver_organization_id = get_user_org_id_safe(auth.uid())
);

CREATE POLICY "Senders can delete their notes" 
ON partner_notes FOR DELETE 
USING (
  sender_organization_id = get_user_org_id_safe(auth.uid())
);