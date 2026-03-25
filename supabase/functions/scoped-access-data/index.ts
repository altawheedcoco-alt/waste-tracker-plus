import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { action, linkCode, pin, sessionToken, dataType } = body;

    // Action: validate - validate link and create session
    if (action === 'validate') {
      if (!linkCode) {
        return new Response(JSON.stringify({ error: 'Link code required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: link, error: linkErr } = await supabase
        .from('scoped_access_links')
        .select('*')
        .eq('link_code', linkCode)
        .eq('is_active', true)
        .single();

      if (linkErr || !link) {
        return new Response(JSON.stringify({ error: 'رابط غير صالح أو غير نشط' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check expiry
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'انتهت صلاحية الرابط' }), {
          status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check max uses
      if (link.max_uses && link.current_uses >= link.max_uses) {
        return new Response(JSON.stringify({ error: 'تم استنفاد عدد الاستخدامات المسموحة' }), {
          status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check PIN
      if (link.access_pin && link.access_pin !== pin) {
        return new Response(JSON.stringify({ error: 'رمز الوصول غير صحيح', requiresPin: true }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create session
      const { data: session, error: sessErr } = await supabase
        .from('scoped_link_sessions')
        .insert({
          link_id: link.id,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        })
        .select('session_token')
        .single();

      if (sessErr) {
        console.error('Session create error:', sessErr);
        return new Response(JSON.stringify({ error: 'فشل في إنشاء الجلسة' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Increment usage
      await supabase
        .from('scoped_access_links')
        .update({ current_uses: link.current_uses + 1, last_accessed_at: new Date().toISOString() })
        .eq('id', link.id);

      // Fetch org names for display
      const orgIds = link.scoped_organization_ids || [];
      let orgNames: Record<string, string> = {};
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        if (orgs) {
          orgs.forEach((o: any) => { orgNames[o.id] = o.name; });
        }
      }

      // Also fetch owner org name
      const { data: ownerOrg } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', link.organization_id)
        .single();

      return new Response(JSON.stringify({
        sessionToken: session.session_token,
        link: {
          id: link.id,
          link_name: link.link_name,
          description: link.description,
          assigned_to_name: link.assigned_to_name,
          organization_id: link.organization_id,
          organization_name: ownerOrg?.name || '',
          scoped_organization_ids: link.scoped_organization_ids,
          scoped_org_names: orgNames,
          can_view_shipments: link.can_view_shipments,
          can_create_shipments: link.can_create_shipments,
          can_view_deposits: link.can_view_deposits,
          can_create_deposits: link.can_create_deposits,
          can_view_ledger: link.can_view_ledger,
          can_view_invoices: link.can_view_invoices,
          waste_types_filter: link.waste_types_filter,
        },
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: fetch-data - get scoped data
    if (action === 'fetch-data') {
      if (!sessionToken || !dataType) {
        return new Response(JSON.stringify({ error: 'Missing params' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate session
      const { data: session } = await supabase
        .from('scoped_link_sessions')
        .select('id, link_id, expires_at')
        .eq('session_token', sessionToken)
        .single();

      if (!session || new Date(session.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'جلسة غير صالحة أو منتهية' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get link config
      const { data: link } = await supabase
        .from('scoped_access_links')
        .select('*')
        .eq('id', session.link_id)
        .single();

      if (!link || !link.is_active) {
        return new Response(JSON.stringify({ error: 'الرابط غير نشط' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const allOrgIds = [link.organization_id, ...(link.scoped_organization_ids || [])];
      let result: any = null;

      switch (dataType) {
        case 'shipments': {
          if (!link.can_view_shipments) {
            return new Response(JSON.stringify({ error: 'ليس لديك صلاحية عرض الشحنات' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          let query = supabase
            .from('shipments')
            .select(`id, tracking_number, status, waste_type, waste_subtype, quantity, unit,
              pickup_address, delivery_address, created_at, updated_at,
              estimated_delivery, actual_delivery, notes, price_per_ton, total_price,
              generator_id, transporter_id, recycler_id`)
            .or(allOrgIds.map(id => `generator_id.eq.${id},transporter_id.eq.${id},recycler_id.eq.${id}`).join(','))
            .order('created_at', { ascending: false })
            .limit(100);

          if (link.waste_types_filter && link.waste_types_filter.length > 0) {
            query = query.in('waste_type', link.waste_types_filter);
          }

          const { data } = await query;
          
          // Enrich with org names
          const orgSet = new Set<string>();
          (data || []).forEach((s: any) => {
            if (s.generator_id) orgSet.add(s.generator_id);
            if (s.transporter_id) orgSet.add(s.transporter_id);
            if (s.recycler_id) orgSet.add(s.recycler_id);
          });
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', Array.from(orgSet));
          const orgMap: Record<string, string> = {};
          (orgData || []).forEach((o: any) => { orgMap[o.id] = o.name; });

          result = (data || []).map((s: any) => ({
            ...s,
            generator_name: orgMap[s.generator_id] || '',
            transporter_name: orgMap[s.transporter_id] || '',
            recycler_name: orgMap[s.recycler_id] || '',
          }));
          break;
        }

        case 'deposits': {
          if (!link.can_view_deposits) {
            return new Response(JSON.stringify({ error: 'ليس لديك صلاحية عرض الإيداعات' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          const { data } = await supabase
            .from('deposits')
            .select('*')
            .in('organization_id', allOrgIds)
            .order('created_at', { ascending: false })
            .limit(100);
          result = data || [];
          break;
        }

        case 'ledger': {
          if (!link.can_view_ledger) {
            return new Response(JSON.stringify({ error: 'ليس لديك صلاحية عرض كشف الحساب' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          const { data } = await supabase
            .from('accounting_ledger')
            .select('*')
            .in('organization_id', allOrgIds)
            .order('entry_date', { ascending: false })
            .limit(200);
          
          // Enrich with org names
          const partnerIds = new Set<string>();
          (data || []).forEach((e: any) => {
            if (e.partner_organization_id) partnerIds.add(e.partner_organization_id);
            if (e.organization_id) partnerIds.add(e.organization_id);
          });
          const { data: pOrgs } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', Array.from(partnerIds));
          const pMap: Record<string, string> = {};
          (pOrgs || []).forEach((o: any) => { pMap[o.id] = o.name; });

          result = (data || []).map((e: any) => ({
            ...e,
            organization_name: pMap[e.organization_id] || '',
            partner_name: pMap[e.partner_organization_id] || '',
          }));
          break;
        }

        case 'summary': {
          // Financial summary across scoped orgs
          const { data: shipments } = await supabase
            .from('shipments')
            .select('total_price, quantity, waste_type, status')
            .or(allOrgIds.map(id => `generator_id.eq.${id},transporter_id.eq.${id},recycler_id.eq.${id}`).join(','));

          const { data: deposits } = await supabase
            .from('deposits')
            .select('amount, status')
            .in('organization_id', allOrgIds);

          const totalShipmentValue = (shipments || []).reduce((s: number, r: any) => s + (r.total_price || 0), 0);
          const totalQuantity = (shipments || []).reduce((s: number, r: any) => s + (r.quantity || 0), 0);
          const totalDeposits = (deposits || []).filter((d: any) => d.status === 'confirmed' || d.status === 'approved')
            .reduce((s: number, d: any) => s + (d.amount || 0), 0);
          const balance = totalDeposits - totalShipmentValue;

          result = {
            totalShipmentValue,
            totalQuantity,
            totalDeposits,
            balance,
            shipmentsCount: (shipments || []).length,
            depositsCount: (deposits || []).length,
          };
          break;
        }

        default:
          return new Response(JSON.stringify({ error: 'نوع بيانات غير معروف' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }

      return new Response(JSON.stringify({ data: result }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Scoped access error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
