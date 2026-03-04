const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WAPILOT_BASE = 'https://api.wapilot.net/api/v2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const token = Deno.env.get('WAPILOT_API_TOKEN');
  const instanceId = Deno.env.get('WAPILOT_INSTANCE_ID');

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    token_configured: !!token,
    token_length: token?.length || 0,
    token_preview: token ? `${token.slice(0, 6)}...${token.slice(-4)}` : null,
    instance_id_configured: !!instanceId,
    instance_id: instanceId || null,
    api_base: WAPILOT_BASE,
    tests: {},
  };

  if (!token) {
    diagnostics.summary = 'WAPILOT_API_TOKEN غير مُعدّ';
    return new Response(JSON.stringify(diagnostics, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Test campaigns (known working endpoint)
  try {
    const r = await fetch(`${WAPILOT_BASE}/campaigns`, { headers: { token } });
    const d = await r.json().catch(() => ({}));
    diagnostics.tests['campaigns'] = { status: r.status, ok: r.ok, count: d?.data?.length ?? 0 };
  } catch (e: any) {
    diagnostics.tests['campaigns'] = { error: e.message };
  }

  // Test instance if ID is set
  if (instanceId) {
    // Instance info
    try {
      const r = await fetch(`${WAPILOT_BASE}/instances/${instanceId}`, { headers: { token } });
      const d = await r.json().catch(() => ({}));
      diagnostics.tests['instance_info'] = { status: r.status, data: d };
    } catch (e: any) {
      diagnostics.tests['instance_info'] = { error: e.message };
    }

    // Instance status
    try {
      const r = await fetch(`${WAPILOT_BASE}/instances/${instanceId}/status`, { headers: { token } });
      const d = await r.json().catch(() => ({}));
      diagnostics.tests['instance_status'] = { status: r.status, data: d };
    } catch (e: any) {
      diagnostics.tests['instance_status'] = { error: e.message };
    }
  } else {
    diagnostics.tests['instance'] = { skipped: true, reason: 'WAPILOT_INSTANCE_ID not set' };
  }

  diagnostics.summary = instanceId
    ? 'Token ✓ | Instance ID ✓ — جاري فحص الاتصال'
    : 'Token ✓ | Instance ID ✗ — يجب إضافة WAPILOT_INSTANCE_ID';

  return new Response(JSON.stringify(diagnostics, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
