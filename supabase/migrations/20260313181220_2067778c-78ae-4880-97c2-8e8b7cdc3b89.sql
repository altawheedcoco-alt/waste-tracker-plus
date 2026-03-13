-- Force-enable all auto actions for ALL existing organizations
UPDATE public.organization_auto_actions
SET
  all_actions_enabled = true,
  auto_delivery_certificate = true,
  auto_receipt_generation = true,
  auto_manifest_generation = true,
  auto_invoice_generation = true,
  auto_tracking_form = true,
  auto_shipment_notifications = true,
  auto_status_change_alerts = true,
  auto_partner_notifications = true,
  auto_whatsapp_notifications = true,
  auto_email_notifications = true,
  auto_shipment_status_update = true,
  auto_weight_reconciliation = true,
  auto_compliance_check = true,
  auto_archive_documents = true,
  auto_signature_request = true,
  auto_waste_classification = true,
  auto_route_optimization = true,
  auto_fraud_detection = true,
  auto_price_calculation = true,
  updated_at = now();

-- Also ensure any organizations that don't have a row get one
INSERT INTO public.organization_auto_actions (organization_id)
SELECT id FROM public.organizations
WHERE id NOT IN (SELECT organization_id FROM public.organization_auto_actions)
ON CONFLICT (organization_id) DO NOTHING;