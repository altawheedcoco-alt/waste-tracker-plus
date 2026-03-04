import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WAPILOT_BASE = 'https://api.wapilot.net/api/v2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('WAPILOT_API_TOKEN');
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

    let url: string;
    let method = 'GET';
    let fetchBody: string | undefined;

    switch (action) {
      case 'list-instances':
        url = `${WAPILOT_BASE}/instances`;
        break;
      case 'instance-status':
        url = `${WAPILOT_BASE}/instances/${instance_id}/status`;
        break;
      case 'send-message':
        url = `${WAPILOT_BASE}/${instance_id}/send-message`;
        method = 'POST';
        fetchBody = JSON.stringify({
          chat_id: params.chat_id,
          text: params.text,
          priority: params.priority,
          send_at: params.send_at,
        });
        break;
      case 'send-list':
        url = `${WAPILOT_BASE}/${instance_id}/send-list`;
        method = 'POST';
        fetchBody = JSON.stringify({
          chat_id: params.chat_id,
          interactive: params.interactive,
        });
        break;
      case 'list-messages':
        url = `${WAPILOT_BASE}/${instance_id}/messages`;
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
