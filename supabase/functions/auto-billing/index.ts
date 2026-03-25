import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { shipmentId, organizationId } = await req.json();
    if (!shipmentId) throw new Error("shipmentId is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch shipment details
    const { data: shipment, error: shipErr } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipErr || !shipment) throw new Error("Shipment not found");
    if (!['delivered', 'confirmed', 'completed'].includes(shipment.status)) {
      throw new Error("Shipment must be delivered/confirmed to generate invoice");
    }

    // 2. Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('shipment_id', shipmentId)
      .maybeSingle();

    if (existingInvoice) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Invoice already exists',
        invoice: existingInvoice,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Calculate total
    const totalValue = shipment.total_value || (shipment.price_per_unit || 0) * (shipment.quantity || 1);
    const taxRate = 0.15; // 15% VAT
    const taxAmount = Math.round(totalValue * taxRate * 100) / 100;
    const totalWithTax = Math.round((totalValue + taxAmount) * 100) / 100;

    // 4. Create invoice
    const orgId = organizationId || shipment.transporter_id;
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        organization_id: orgId,
        shipment_id: shipmentId,
        customer_organization_id: shipment.generator_id,
        invoice_type: 'shipment',
        amount: totalValue,
        tax_amount: taxAmount,
        total_amount: totalWithTax,
        tax_rate: taxRate * 100,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `فاتورة تلقائية - شحنة ${shipment.shipment_number}`,
        currency: 'SAR',
      })
      .select()
      .single();

    if (invErr) throw invErr;

    // 5. Create accounting ledger entry
    await supabase.from('accounting_ledger').insert({
      organization_id: orgId,
      entry_type: 'credit',
      entry_category: 'shipment_revenue',
      amount: totalWithTax,
      description: `إيرادات شحنة ${shipment.shipment_number}`,
      shipment_id: shipmentId,
      invoice_id: invoice.id,
      entry_date: new Date().toISOString().split('T')[0],
      partner_organization_id: shipment.generator_id,
    });

    return new Response(JSON.stringify({
      success: true,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: totalValue,
        tax: taxAmount,
        total: totalWithTax,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error("Auto-billing error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
