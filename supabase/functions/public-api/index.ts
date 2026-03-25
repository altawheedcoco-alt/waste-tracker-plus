import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ApiKeyInfo {
  api_key_id: string;
  organization_id: string;
  scopes: string[];
  rate_limit: number;
}

interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  reset_at: string;
  limit_per_minute: number;
}

// Hash API key for comparison
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key and check rate limit
async function validateRequest(
  supabase: any,
  apiKey: string,
  requiredScope: string
): Promise<{ valid: boolean; error?: string; keyInfo?: ApiKeyInfo; rateLimit?: RateLimitInfo }> {
  const keyHash = await hashApiKey(apiKey);
  
  // Validate API key
  const { data: keyData, error: keyError } = await supabase
    .rpc('validate_api_key', { p_key_hash: keyHash });
  
  if (keyError || !keyData || keyData.length === 0) {
    console.log('API key validation failed:', keyError?.message || 'Key not found');
    return { valid: false, error: 'Invalid API key' };
  }
  
  const keyInfo = keyData[0] as ApiKeyInfo;
  
  // Check scope
  const scopes = keyInfo.scopes as string[];
  if (!scopes.includes('all') && !scopes.includes(requiredScope)) {
    return { valid: false, error: `Insufficient permissions. Required scope: ${requiredScope}` };
  }
  
  // Check rate limit with enhanced function
  const { data: rateLimitData, error: rateLimitError } = await supabase
    .rpc('check_api_rate_limit', { p_api_key_id: keyInfo.api_key_id });
  
  if (rateLimitError) {
    console.error('Rate limit check error:', rateLimitError);
    return { valid: false, error: 'Rate limit check failed' };
  }
  
  const rateLimit = rateLimitData?.[0] as RateLimitInfo;
  
  if (!rateLimit?.allowed) {
    return { 
      valid: false, 
      error: 'Rate limit exceeded. Please try again later.',
      rateLimit 
    };
  }
  
  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyInfo.api_key_id);
  
  return { valid: true, keyInfo, rateLimit };
}

// Log API request
async function logRequest(
  supabase: any,
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress: string | null,
  userAgent: string | null,
  errorMessage: string | null,
  requestBody: any = null
) {
  try {
    await supabase.from('api_request_logs').insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: ipAddress,
      user_agent: userAgent,
      error_message: errorMessage,
      request_body: requestBody,
    });
  } catch (e) {
    console.error('Failed to log request:', e);
  }
}

// Build rate limit headers
function buildRateLimitHeaders(rateLimit?: RateLimitInfo): Record<string, string> {
  if (!rateLimit) return {};
  
  const resetTimestamp = Math.floor(new Date(rateLimit.reset_at).getTime() / 1000);
  
  return {
    'X-RateLimit-Limit': String(rateLimit.limit_per_minute),
    'X-RateLimit-Remaining': String(Math.max(0, rateLimit.remaining - 1)),
    'X-RateLimit-Reset': String(resetTimestamp),
    'RateLimit-Limit': String(rateLimit.limit_per_minute),
    'RateLimit-Remaining': String(Math.max(0, rateLimit.remaining - 1)),
    'RateLimit-Reset': String(resetTimestamp),
  };
}

// API Handlers
async function handleShipments(
  supabase: any,
  orgId: string,
  method: string,
  path: string[],
  body: any
) {
  const shipmentId = path[1];
  
  if (method === 'GET') {
    if (shipmentId) {
      // Get single shipment
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          generator:organizations!shipments_generator_id_fkey(id, name, client_code),
          transporter:organizations!shipments_transporter_id_fkey(id, name, client_code),
          recycler:organizations!shipments_recycler_id_fkey(id, name, client_code)
        `)
        .eq('id', shipmentId)
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .single();
      
      if (error) return { status: 404, data: { error: 'Shipment not found' } };
      return { status: 200, data };
    } else {
      // List shipments with pagination
      const page = parseInt(body?.page) || 1;
      const limit = Math.min(parseInt(body?.limit) || 20, 100);
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, status, waste_type, quantity, unit, scheduled_date, created_at,
          generator:organizations!shipments_generator_id_fkey(id, name),
          transporter:organizations!shipments_transporter_id_fkey(id, name),
          recycler:organizations!shipments_recycler_id_fkey(id, name)
        `, { count: 'exact' })
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) return { status: 500, data: { error: error.message } };
      
      return {
        status: 200,
        data: {
          shipments: data,
          pagination: {
            page,
            limit,
            total: count,
            total_pages: Math.ceil((count || 0) / limit)
          }
        }
      };
    }
  }
  
  if (method === 'POST') {
    const { waste_type, quantity, unit, scheduled_date, notes, generator_id, transporter_id, recycler_id } = body;
    
    if (!waste_type || !quantity) {
      return { status: 400, data: { error: 'waste_type and quantity are required' } };
    }
    
    const { data, error } = await supabase
      .from('shipments')
      .insert({
        waste_type,
        quantity,
        unit: unit || 'kg',
        scheduled_date,
        notes,
        generator_id: generator_id || orgId,
        transporter_id,
        recycler_id,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) return { status: 400, data: { error: error.message } };
    return { status: 201, data };
  }
  
  if (method === 'PUT' && shipmentId) {
    const { status, quantity, notes } = body;
    
    const { data, error } = await supabase
      .from('shipments')
      .update({ status, quantity, notes, updated_at: new Date().toISOString() })
      .eq('id', shipmentId)
      .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
      .select()
      .single();
    
    if (error) return { status: 400, data: { error: error.message } };
    return { status: 200, data };
  }
  
  return { status: 405, data: { error: 'Method not allowed' } };
}

async function handleInvoices(
  supabase: any,
  orgId: string,
  method: string,
  path: string[],
  body: any
) {
  if (method !== 'GET') {
    return { status: 405, data: { error: 'Only GET method is supported for invoices' } };
  }
  
  const invoiceId = path[1];
  
  if (invoiceId) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('organization_id', orgId)
      .single();
    
    if (error) return { status: 404, data: { error: 'Invoice not found' } };
    return { status: 200, data };
  }
  
  const page = parseInt(body?.page) || 1;
  const limit = Math.min(parseInt(body?.limit) || 20, 100);
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) return { status: 500, data: { error: error.message } };
  
  return {
    status: 200,
    data: {
      invoices: data,
      pagination: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) }
    }
  };
}

async function handleReports(
  supabase: any,
  orgId: string,
  method: string,
  path: string[],
  body: any
) {
  if (method !== 'GET') {
    return { status: 405, data: { error: 'Only GET method is supported for reports' } };
  }
  
  const reportType = path[1] || 'summary';
  const startDate = body?.start_date;
  const endDate = body?.end_date;
  
  if (reportType === 'summary') {
    // Get shipment summary
    let query = supabase
      .from('shipments')
      .select('status, quantity, waste_type')
      .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`);
    
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    
    const { data: shipments, error } = await query;
    
    if (error) return { status: 500, data: { error: error.message } };
    
    // Calculate summary
    const summary = {
      total_shipments: shipments.length,
      total_quantity: shipments.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0),
      by_status: shipments.reduce((acc: any, s: any) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {}),
      by_waste_type: shipments.reduce((acc: any, s: any) => {
        acc[s.waste_type] = (acc[s.waste_type] || 0) + (s.quantity || 0);
        return acc;
      }, {}),
      period: { start_date: startDate, end_date: endDate }
    };
    
    return { status: 200, data: summary };
  }
  
  if (reportType === 'financial') {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('status, total_amount, paid_amount, currency')
      .eq('organization_id', orgId);
    
    if (error) return { status: 500, data: { error: error.message } };
    
    const summary = {
      total_invoices: invoices.length,
      total_amount: invoices.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0),
      total_paid: invoices.reduce((sum: number, i: any) => sum + (i.paid_amount || 0), 0),
      by_status: invoices.reduce((acc: any, i: any) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {})
    };
    
    return { status: 200, data: summary };
  }
  
  return { status: 400, data: { error: 'Unknown report type. Available: summary, financial' } };
}

async function handleOrganization(
  supabase: any,
  orgId: string,
  method: string
) {
  if (method !== 'GET') {
    return { status: 405, data: { error: 'Only GET method is supported' } };
  }
  
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, organization_type, client_code, city, address, phone, email, is_verified, created_at')
    .eq('id', orgId)
    .single();
  
  if (error) return { status: 404, data: { error: 'Organization not found' } };
  return { status: 200, data };
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get API key from header
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ 
        error: 'API key required',
        message: 'Add x-api-key header with your API key'
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Parse URL and determine endpoint
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Remove 'public-api' from path if present
  if (pathParts[0] === 'public-api') pathParts.shift();
  
  const resource = pathParts[0];
  const method = req.method;
  
  // Determine required scope
  let requiredScope = 'all';
  if (resource === 'shipments') {
    requiredScope = method === 'GET' ? 'shipments:read' : 'shipments:write';
  } else if (resource === 'invoices' || resource === 'accounts') {
    requiredScope = method === 'GET' ? 'accounts:read' : 'accounts:write';
  } else if (resource === 'reports') {
    requiredScope = 'reports:read';
  } else if (resource === 'organization') {
    requiredScope = 'organizations:read';
  }
  
  // Validate request
  const validation = await validateRequest(supabase, apiKey, requiredScope);
  
  // Handle rate limit exceeded with proper headers
  if (!validation.valid && validation.error?.includes('Rate limit')) {
    const rateLimitHeaders = buildRateLimitHeaders(validation.rateLimit);
    return new Response(
      JSON.stringify({ 
        error: 'Too Many Requests',
        message: validation.error,
        retry_after: 60
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          ...rateLimitHeaders,
          'Content-Type': 'application/json',
          'Retry-After': '60'
        } 
      }
    );
  }
  
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: validation.error }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const keyInfo = validation.keyInfo!;
  const rateLimit = validation.rateLimit;
  const orgId = keyInfo.organization_id;
  
  // Parse body for POST/PUT
  let body: any = {};
  if (method === 'POST' || method === 'PUT') {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  } else {
    // Parse query params for GET
    for (const [key, value] of url.searchParams) {
      body[key] = value;
    }
  }
  
  let result: { status: number; data: any } = { status: 404, data: { error: 'Endpoint not found' } };
  
  try {
    switch (resource) {
      case 'shipments':
        result = await handleShipments(supabase, orgId, method, pathParts, body);
        break;
      case 'invoices':
      case 'accounts':
        result = await handleInvoices(supabase, orgId, method, pathParts, body);
        break;
      case 'reports':
        result = await handleReports(supabase, orgId, method, pathParts, body);
        break;
      case 'organization':
        result = await handleOrganization(supabase, orgId, method);
        break;
      case 'health':
        result = { status: 200, data: { status: 'ok', timestamp: new Date().toISOString() } };
        break;
      case 'rate-limit':
        // Endpoint to check current rate limit status
        result = { 
          status: 200, 
          data: { 
            limit: rateLimit?.limit_per_minute,
            remaining: Math.max(0, (rateLimit?.remaining || 0) - 1),
            reset_at: rateLimit?.reset_at
          } 
        };
        break;
      default:
        result = { 
          status: 200, 
          data: { 
            message: 'I-Recycle Public API',
            version: '1.0.0',
            endpoints: [
              'GET /shipments - List shipments',
              'GET /shipments/:id - Get shipment details',
              'POST /shipments - Create shipment',
              'PUT /shipments/:id - Update shipment',
              'GET /invoices - List invoices',
              'GET /reports/summary - Get shipment summary report',
              'GET /reports/financial - Get financial report',
              'GET /organization - Get organization details',
              'GET /rate-limit - Check current rate limit status',
              'GET /health - Health check'
            ],
            rate_limiting: {
              window: '1 minute',
              headers: {
                'X-RateLimit-Limit': 'Requests allowed per window',
                'X-RateLimit-Remaining': 'Requests remaining in current window',
                'X-RateLimit-Reset': 'Unix timestamp when window resets'
              }
            },
            documentation: '/docs'
          }
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    result = { status: 500, data: { error: 'Internal server error' } };
  }
  
  const responseTime = Date.now() - startTime;
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit);
  
  // Log request
  await logRequest(
    supabase,
    keyInfo.api_key_id,
    `/${pathParts.join('/')}`,
    method,
    result.status,
    responseTime,
    req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
    req.headers.get('user-agent'),
    result.status >= 400 ? JSON.stringify(result.data) : null,
    method !== 'GET' ? body : null
  );
  
  return new Response(
    JSON.stringify(result.data),
    {
      status: result.status,
      headers: {
        ...corsHeaders,
        ...rateLimitHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`,
      }
    }
  );
});
