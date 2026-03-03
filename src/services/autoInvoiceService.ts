import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AutoInvoiceParams {
  shipmentId: string;
  organizationId: string;
  userId: string;
}

/**
 * Automatically generates an invoice for a delivered/confirmed shipment.
 * Dual-mode: Auto on delivery + Manual from invoice page.
 */
export async function generateAutoInvoice({ shipmentId, organizationId, userId }: AutoInvoiceParams): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    // Check if invoice already exists for this shipment
    const { data: existingInvoice } = await (supabase
      .from('invoices') as any)
      .select('id')
      .eq('shipment_id', shipmentId)
      .maybeSingle();

    if (existingInvoice) {
      return { success: false, error: 'Invoice already exists' };
    }

    // Fetch shipment details
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, shipment_number, waste_type, quantity, unit, generator_id, transporter_id, recycler_id, delivered_at')
      .eq('id', shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return { success: false, error: 'Shipment not found' };
    }

    const quantity = shipment.quantity || 1;
    const invoiceNumber = `INV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Create draft invoice
    const { data: invoice, error: invoiceError } = await (supabase
      .from('invoices') as any)
      .insert({
        invoice_number: invoiceNumber,
        organization_id: organizationId,
        partner_organization_id: shipment.generator_id,
        shipment_id: shipmentId,
        amount: 0,
        status: 'draft',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'فاتورة تلقائية - يرجى تحديد السعر',
        created_by: userId,
      })
      .select('id')
      .single();

    if (invoiceError) {
      console.error('Auto-invoice error:', invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Notify user
    await (supabase.from('notifications') as any).insert({
      user_id: userId,
      title: '📄 مسودة فاتورة تلقائية',
      message: `تم إنشاء مسودة فاتورة ${invoiceNumber} للشحنة ${shipment.shipment_number || shipmentId.slice(0, 8)}`,
      type: 'invoice',
      is_read: false,
    });

    return { success: true, invoiceId: invoice?.id };
  } catch (err: any) {
    console.error('Auto-invoice error:', err);
    return { success: false, error: err.message };
  }
}
