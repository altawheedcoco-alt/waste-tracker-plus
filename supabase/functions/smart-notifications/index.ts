import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  user_id?: string
  organization_id?: string
  title: string
  message: string
  type: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  data?: Record<string, unknown>
  shipment_id?: string
  channels?: ('in_app' | 'push' | 'email')[]
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

    const { action, ...data } = await req.json()
    console.log(`[Smart Notifications] Action: ${action}`)

    switch (action) {
      case 'send': {
        const payload = data as NotificationPayload
        const results: { channel: string; success: boolean; error?: string }[] = []
        const channels = payload.channels || ['in_app']

        // Get target users
        let targetUserIds: string[] = []
        
        if (payload.user_id) {
          targetUserIds = [payload.user_id]
        } else if (payload.organization_id) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('organization_id', payload.organization_id)
            .eq('is_active', true)
          
          targetUserIds = (profiles || []).map(p => p.user_id).filter(Boolean)
        }

        if (targetUserIds.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No target users found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // In-app notifications
        if (channels.includes('in_app')) {
          for (const userId of targetUserIds) {
            const { error } = await supabase.from('notifications').insert({
              user_id: userId,
              title: payload.title,
              message: payload.message,
              type: payload.type,
              shipment_id: payload.shipment_id,
              is_read: false
            })

            if (error) {
              results.push({ channel: 'in_app', success: false, error: error.message })
            } else {
              results.push({ channel: 'in_app', success: true })
            }
          }
        }

        console.log(`[Smart Notifications] Sent to ${targetUserIds.length} users`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            results,
            recipients: targetUserIds.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'send-bulk': {
        const { notifications } = data as { notifications: NotificationPayload[] }
        
        if (!notifications || !Array.isArray(notifications)) {
          return new Response(
            JSON.stringify({ error: 'notifications array is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const insertData = notifications
          .filter(n => n.user_id)
          .map(n => ({
            user_id: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type,
            shipment_id: n.shipment_id,
            is_read: false
          }))

        const { error, data: inserted } = await supabase
          .from('notifications')
          .insert(insertData)
          .select()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`[Smart Notifications] Bulk sent ${inserted?.length || 0} notifications`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            sent: inserted?.length || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'shipment-approval-request': {
        const { shipment_id, approval_type } = data

        if (!shipment_id) {
          return new Response(
            JSON.stringify({ error: 'shipment_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get shipment details with all organization info
        const { data: shipment } = await supabase
          .from('shipments')
          .select('*')
          .eq('id', shipment_id)
          .single()

        if (!shipment) {
          return new Response(
            JSON.stringify({ error: 'Shipment not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Determine target organization based on approval_type
        const targetOrgId = approval_type === 'generator' 
          ? shipment.generator_id 
          : shipment.recycler_id

        if (!targetOrgId) {
          return new Response(
            JSON.stringify({ error: 'Target organization not found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get users in target organization
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('organization_id', targetOrgId)
          .eq('is_active', true)

        // Build detailed notification message
        const wasteInfo = `${shipment.waste_type} - ${shipment.quantity} ${shipment.unit || 'كجم'}`
        const message = `📦 شحنة جديدة تحتاج موافقتك\n\nرقم الشحنة: ${shipment.shipment_number}\nنوع المخلف: ${wasteInfo}\n\n⏰ الموافقة التلقائية بعد 6 ساعات`

        const notifications = (profiles || []).map(p => ({
          user_id: p.user_id,
          title: '🔔 طلب موافقة على شحنة',
          message,
          type: 'shipment_approval_request',
          shipment_id,
          is_read: false
        }))

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications)
        }

        console.log(`[Smart Notifications] Approval request sent for shipment ${shipment_id} to ${approval_type}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            notified: notifications.length,
            shipment_number: shipment.shipment_number
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'shipment-delayed': {
        const { shipment_id, delay_reason, estimated_delay_minutes } = data

        if (!shipment_id) {
          return new Response(
            JSON.stringify({ error: 'shipment_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get shipment details
        const { data: shipment } = await supabase
          .from('shipments')
          .select('*, generator:organizations!generator_id(name), transporter:organizations!transporter_id(name), recycler:organizations!recycler_id(name)')
          .eq('id', shipment_id)
          .single()

        if (!shipment) {
          return new Response(
            JSON.stringify({ error: 'Shipment not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get all related users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, organization_id')
          .in('organization_id', [shipment.generator_id, shipment.transporter_id, shipment.recycler_id].filter(Boolean))
          .eq('is_active', true)

        const message = `⚠️ تأخر في الشحنة ${shipment.shipment_number}${delay_reason ? `: ${delay_reason}` : ''}${estimated_delay_minutes ? ` - التأخير المتوقع: ${estimated_delay_minutes} دقيقة` : ''}`

        // Send notifications
        const notifications = (profiles || []).map(p => ({
          user_id: p.user_id,
          title: '⏰ تنبيه تأخير شحنة',
          message,
          type: 'shipment_delayed',
          shipment_id,
          is_read: false
        }))

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications)
        }

        console.log(`[Smart Notifications] Delay alert sent for shipment ${shipment_id}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            notified: notifications.length,
            shipment_number: shipment.shipment_number
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'contract-expiry': {
        const { days_before = 30 } = data

        // Get contracts expiring soon
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + days_before)

        const { data: contracts } = await supabase
          .from('contracts')
          .select('*, organization:organizations!organization_id(name)')
          .lte('end_date', expiryDate.toISOString().split('T')[0])
          .gte('end_date', new Date().toISOString().split('T')[0])
          .eq('status', 'active')

        let totalNotified = 0

        for (const contract of contracts || []) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('organization_id', contract.organization_id)
            .eq('is_active', true)

          const daysUntilExpiry = Math.ceil(
            (new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )

          const notifications = (profiles || []).map(p => ({
            user_id: p.user_id,
            title: '📋 تنبيه انتهاء عقد',
            message: `العقد "${contract.title}" سينتهي خلال ${daysUntilExpiry} يوم`,
            type: 'contract_expiry',
            is_read: false
          }))

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
            totalNotified += notifications.length
          }
        }

        console.log(`[Smart Notifications] Contract expiry alerts: ${totalNotified}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            contracts_checked: contracts?.length || 0,
            notifications_sent: totalNotified
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'ping':
        return new Response(
          JSON.stringify({ success: true, message: 'Smart Notifications service is running', timestamp: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: send, send-bulk, shipment-delayed, contract-expiry, ping' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('[Smart Notifications] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
