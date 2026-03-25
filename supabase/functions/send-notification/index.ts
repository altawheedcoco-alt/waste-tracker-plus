/**
 * Multi-Channel Notification Edge Function
 * Sends notifications via WhatsApp, SMS using Twilio
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  userId?: string;
  phone?: string;
  channel: 'whatsapp' | 'sms';
  message: string;
  notificationId?: string;
}

async function sendTwilioMessage(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
  isWhatsApp: boolean
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const fromNumber = isWhatsApp ? `whatsapp:${from}` : from;
  const toNumber = isWhatsApp ? `whatsapp:${to}` : to;

  const params = new URLSearchParams({
    From: fromNumber,
    To: toNumber,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  const data = await response.json();

  if (response.ok) {
    return { success: true, sid: data.sid };
  }
  return { success: false, error: data.message || 'Failed to send' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    const body = await req.json();
    const { action = 'send', ...data } = body;

    switch (action) {
      case 'send': {
        const { userId, phone, channel, message, notificationId } = data as NotificationRequest;

        if (!twilioSid || !twilioToken || !twilioPhone) {
          // Log as pending - Twilio not configured
          if (notificationId) {
            await supabase.from('notification_delivery_log').insert({
              notification_id: notificationId,
              channel_type: channel,
              recipient_phone: phone,
              recipient_user_id: userId,
              status: 'failed',
              error_message: 'Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets.',
            });
          }
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Twilio credentials not configured',
              hint: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER as secrets'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Resolve phone number
        let targetPhone = phone;
        if (!targetPhone && userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('user_id', userId)
            .single();
          targetPhone = profile?.phone;
        }

        if (!targetPhone) {
          return new Response(
            JSON.stringify({ success: false, error: 'No phone number found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const isWhatsApp = channel === 'whatsapp';
        const result = await sendTwilioMessage(
          twilioSid, twilioToken, twilioPhone, targetPhone, message, isWhatsApp
        );

        // Log delivery
        await supabase.from('notification_delivery_log').insert({
          notification_id: notificationId || null,
          channel_type: channel,
          recipient_phone: targetPhone,
          recipient_user_id: userId,
          status: result.success ? 'sent' : 'failed',
          external_id: result.sid,
          error_message: result.error,
          sent_at: result.success ? new Date().toISOString() : null,
        });

        return new Response(
          JSON.stringify({ success: result.success, sid: result.sid, error: result.error }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'broadcast': {
        // Send to all users with enabled channel
        const { channel, message, notificationType } = data;
        
        const query = supabase
          .from('notification_channels')
          .select('user_id, phone_number')
          .eq('channel_type', channel)
          .eq('is_enabled', true);

        // Filter by notification type preference
        if (notificationType === 'shipment') {
          query.eq('notify_shipment_updates', true);
        } else if (notificationType === 'payment') {
          query.eq('notify_payment_updates', true);
        } else if (notificationType === 'contract') {
          query.eq('notify_contract_alerts', true);
        } else if (notificationType === 'system') {
          query.eq('notify_system_alerts', true);
        }

        const { data: channels } = await query;
        
        let sent = 0;
        let failed = 0;

        for (const ch of channels || []) {
          if (!ch.phone_number) continue;
          
          if (twilioSid && twilioToken && twilioPhone) {
            const result = await sendTwilioMessage(
              twilioSid, twilioToken, twilioPhone, ch.phone_number, message, channel === 'whatsapp'
            );
            
            await supabase.from('notification_delivery_log').insert({
              channel_type: channel,
              recipient_phone: ch.phone_number,
              recipient_user_id: ch.user_id,
              status: result.success ? 'sent' : 'failed',
              external_id: result.sid,
              error_message: result.error,
              sent_at: result.success ? new Date().toISOString() : null,
            });

            if (result.success) sent++;
            else failed++;
          }
        }

        return new Response(
          JSON.stringify({ success: true, sent, failed, total: channels?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'status': {
        // Check Twilio configuration status
        return new Response(
          JSON.stringify({ 
            configured: !!(twilioSid && twilioToken && twilioPhone),
            hasAccountSid: !!twilioSid,
            hasAuthToken: !!twilioToken,
            hasPhoneNumber: !!twilioPhone,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'ping':
        return new Response(
          JSON.stringify({ success: true, message: 'Send Notification service is running', timestamp: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', available: ['send', 'broadcast', 'status', 'ping'] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[send-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
