import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WAPILOT_BASE = 'https://api.wapilot.net/api/v2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('WAPILOT_API_TOKEN');
    const defaultInstanceId = Deno.env.get('WAPILOT_INSTANCE_ID');

    if (!token) {
      return new Response(JSON.stringify({ error: 'WAPILOT_API_TOKEN not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const jwtToken = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(jwtToken);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action, instance_id, ...params } = body;

    // Use provided instance_id or fall back to env var
    const resolvedInstanceId = instance_id || defaultInstanceId;

    // Actions that require instance_id
    const actionsRequiringInstance = ['instance-status', 'send-message', 'send-media', 'send-list', 'list-messages', 'list-chats', 'get-chat-messages', 'get-qr', 'restart-instance', 'connect-instance', 'disconnect-instance', 'instance-info'];

    if (actionsRequiringInstance.includes(action) && !resolvedInstanceId) {
      return new Response(JSON.stringify({ error: 'Instance ID is required. Set WAPILOT_INSTANCE_ID or provide instance_id.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Special action: diagnostics - return connection info
    if (action === 'diagnostics') {
      const result: Record<string, any> = {
        token_configured: true,
        token_preview: `${token.slice(0, 6)}...${token.slice(-4)}`,
        instance_id: resolvedInstanceId || null,
        api_base: WAPILOT_BASE,
      };

      if (resolvedInstanceId) {
        try {
          const statusRes = await fetch(`${WAPILOT_BASE}/instances/${resolvedInstanceId}/status`, {
            headers: { token },
          });
          result.instance_status = await statusRes.json().catch(() => ({}));
        } catch (e: any) {
          result.instance_status = { error: e.message };
        }
      }

      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For list-instances, return the configured instance as an array
    if (action === 'list-instances') {
      if (resolvedInstanceId) {
        // Fetch status for the known instance
        try {
          const statusRes = await fetch(`${WAPILOT_BASE}/instances/${resolvedInstanceId}/status`, {
            headers: { token },
          });
          const statusData = await statusRes.json().catch(() => ({}));
          return new Response(JSON.stringify([{
            id: resolvedInstanceId,
            name: statusData.me_push_name || 'WaPilot Instance',
            status: statusData.status === 'WORKING' ? 'connected' : statusData.status || 'unknown',
            phone: statusData.me_id?.replace('@c.us', '') || null,
            me: {
              id: statusData.me_id || null,
              pushName: statusData.me_push_name || null,
            },
            status_message: statusData.status_message || null,
          }]), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch {
          return new Response(JSON.stringify([{
            id: resolvedInstanceId,
            name: 'WaPilot Instance',
            status: 'unknown',
          }]), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      return new Response(JSON.stringify([]), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let url: string;
    let method = 'GET';
    let fetchBody: string | undefined;

    switch (action) {
      case 'instance-status':
        url = `${WAPILOT_BASE}/instances/${resolvedInstanceId}/status`;
        break;
      case 'send-message':
        url = `${WAPILOT_BASE}/${resolvedInstanceId}/send-message`;
        method = 'POST';
        // Fix phone formatting: strip leading zeros, ensure country code
        let chatId = params.chat_id || '';
        if (chatId) {
          const rawPhone = chatId.replace('@c.us', '').replace(/[\s+\-()]/g, '').replace(/^0+/, '');
          const fixedPhone = /^1\d{9}$/.test(rawPhone) ? '20' + rawPhone : rawPhone;
          chatId = fixedPhone + '@c.us';
        }
        fetchBody = JSON.stringify({
          chat_id: chatId,
          text: params.text,
          priority: params.priority,
          send_at: params.send_at,
        });
        break;
      case 'send-media': {
        // WaPilot uses send-file with multipart FormData, not send-media JSON
        let mediaChat = params.chat_id || '';
        if (mediaChat) {
          const rawP = mediaChat.replace('@c.us', '').replace(/[\s+\-()]/g, '').replace(/^0+/, '');
          const fixedP = /^1\d{9}$/.test(rawP) ? '20' + rawP : rawP;
          mediaChat = fixedP + '@c.us';
        }

        // Download file from URL
        const fileRes = await fetch(params.media_url);
        if (!fileRes.ok) {
          return new Response(JSON.stringify({ error: 'Failed to download media file', status: fileRes.status }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const fileBlob = await fileRes.blob();
        const fname = params.filename || 'document.pdf';
        const contentType = fileBlob.type || 'application/pdf';

        const formData = new FormData();
        formData.append('chat_id', mediaChat);
        if (params.caption) formData.append('caption', params.caption);
        formData.append('media', new File([fileBlob], fname, { type: contentType }));

        const sendFileRes = await fetch(`${WAPILOT_BASE}/${resolvedInstanceId}/send-file`, {
          method: 'POST',
          headers: { token: token! },
          body: formData,
        });
        const sendFileData = await sendFileRes.json().catch(() => ({}));

        return new Response(JSON.stringify(sendFileData), {
          status: sendFileRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      case 'send-list':
        url = `${WAPILOT_BASE}/${resolvedInstanceId}/send-list`;
        method = 'POST';
        fetchBody = JSON.stringify({
          chat_id: params.chat_id,
          interactive: params.interactive,
        });
        break;
      case 'list-messages':
        url = `${WAPILOT_BASE}/${resolvedInstanceId}/messages`;
        if (params.chat_id) url += `?chat_id=${encodeURIComponent(params.chat_id)}`;
        if (params.limit) url += `${url.includes('?') ? '&' : '?'}limit=${params.limit}`;
        break;
      case 'list-chats':
        url = `${WAPILOT_BASE}/${resolvedInstanceId}/chats`;
        break;
      case 'get-chat-messages':
        url = `${WAPILOT_BASE}/${resolvedInstanceId}/chats/${encodeURIComponent(params.chat_id)}/messages`;
        if (params.limit) url += `?limit=${params.limit}`;
        break;
      case 'list-campaigns':
        url = `${WAPILOT_BASE}/campaigns`;
        break;
      case 'create-campaign':
        url = `${WAPILOT_BASE}/campaigns`;
        method = 'POST';
        fetchBody = JSON.stringify(params);
        break;
      case 'bulk-add-messages':
        url = `${WAPILOT_BASE}/campaigns/${params.campaign_id}/messages`;
        method = 'POST';
        fetchBody = JSON.stringify({ messages: params.messages });
        break;
      case 'start-campaign':
        url = `${WAPILOT_BASE}/campaigns/${params.campaign_id}/start`;
        method = 'POST';
        break;
      case 'campaign-stats':
        url = `${WAPILOT_BASE}/campaigns/${params.campaign_id}/messages/stats`;
        break;
      case 'get-qr':
        url = `${WAPILOT_BASE}/instances/${resolvedInstanceId}/qr`;
        break;
      case 'restart-instance':
        url = `${WAPILOT_BASE}/instances/${resolvedInstanceId}/restart`;
        method = 'POST';
        break;
      case 'connect-instance':
        url = `${WAPILOT_BASE}/instances/${resolvedInstanceId}/connect`;
        method = 'POST';
        break;
      case 'disconnect-instance':
        url = `${WAPILOT_BASE}/instances/${resolvedInstanceId}/disconnect`;
        method = 'POST';
        break;
      case 'instance-info':
        url = `${WAPILOT_BASE}/instances/${resolvedInstanceId}`;
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const headers: Record<string, string> = { token };
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { method, headers, body: fetchBody });
    const data = await response.json().catch(() => ({}));

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('WaPilot proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
