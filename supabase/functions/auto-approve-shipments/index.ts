import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('[Auto-Approve] Running auto-approval check...')

    // Auto-approve generator pending shipments after 15 minutes
    const { data: generatorApproved, error: generatorError } = await supabase
      .from('shipments')
      .update({
        generator_approval_status: 'auto_approved',
        generator_approval_at: new Date().toISOString(),
      })
      .eq('generator_approval_status', 'pending')
      .not('generator_auto_approve_deadline', 'is', null)
      .lt('generator_auto_approve_deadline', new Date().toISOString())
      .select('id, shipment_number, generator_id, transporter_id')

    if (generatorError) {
      console.error('[Auto-Approve] Generator error:', generatorError)
    } else if (generatorApproved && generatorApproved.length > 0) {
      console.log(`[Auto-Approve] Auto-approved ${generatorApproved.length} shipments for generators`)
      
      // Send notifications for auto-approved shipments
      for (const shipment of generatorApproved) {
        // Notify transporter
        if (shipment.transporter_id) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('organization_id', shipment.transporter_id)
            .eq('is_active', true)

          const notifications = (profiles || []).map(p => ({
            user_id: p.user_id,
            title: '✅ موافقة تلقائية على الشحنة',
            message: `الشحنة ${shipment.shipment_number} تمت الموافقة عليها تلقائياً من المولد (انقضاء 15 دقيقة)`,
            type: 'shipment_auto_approved',
            shipment_id: shipment.id,
            is_read: false
          }))

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
          }
        }
      }
    }

    // Auto-approve recycler pending shipments after 15 minutes
    const { data: recyclerApproved, error: recyclerError } = await supabase
      .from('shipments')
      .update({
        recycler_approval_status: 'auto_approved',
        recycler_approval_at: new Date().toISOString(),
      })
      .eq('recycler_approval_status', 'pending')
      .not('recycler_auto_approve_deadline', 'is', null)
      .lt('recycler_auto_approve_deadline', new Date().toISOString())
      .select('id, shipment_number, recycler_id, transporter_id')

    if (recyclerError) {
      console.error('[Auto-Approve] Recycler error:', recyclerError)
    } else if (recyclerApproved && recyclerApproved.length > 0) {
      console.log(`[Auto-Approve] Auto-approved ${recyclerApproved.length} shipments for recyclers`)
      
      // Send notifications for auto-approved shipments
      for (const shipment of recyclerApproved) {
        // Notify transporter
        if (shipment.transporter_id) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('organization_id', shipment.transporter_id)
            .eq('is_active', true)

          const notifications = (profiles || []).map(p => ({
            user_id: p.user_id,
            title: '✅ موافقة تلقائية على الشحنة',
            message: `الشحنة ${shipment.shipment_number} تمت الموافقة عليها تلقائياً من المدور (انقضاء 15 دقيقة)`,
            type: 'shipment_auto_approved',
            shipment_id: shipment.id,
            is_read: false
          }))

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
          }
        }
      }
    }

    const totalApproved = (generatorApproved?.length || 0) + (recyclerApproved?.length || 0)

    return new Response(
      JSON.stringify({
        success: true,
        generator_approved: generatorApproved?.length || 0,
        recycler_approved: recyclerApproved?.length || 0,
        total_approved: totalApproved,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Auto-Approve] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
