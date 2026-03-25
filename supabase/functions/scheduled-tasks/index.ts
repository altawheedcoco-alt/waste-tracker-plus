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

    const { task, ...data } = await req.json()
    console.log(`[Scheduled Tasks] Running: ${task}`)

    switch (task) {
      case 'auto-approve-shipments': {
        // Auto-approve shipments after 6 hours
        const { data: pendingShipments } = await supabase
          .from('shipments')
          .select('id, shipment_number, generator_id, transporter_id, recycler_id, auto_approve_at')
          .eq('status', 'new')
          .lte('auto_approve_at', new Date().toISOString())

        let approved = 0
        for (const shipment of pendingShipments || []) {
          const { error } = await supabase
            .from('shipments')
            .update({ 
              status: 'approved', 
              approved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', shipment.id)

          if (!error) approved++
        }

        console.log(`[Scheduled Tasks] Auto-approved ${approved} shipments`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'auto-approve-shipments',
            processed: pendingShipments?.length || 0,
            approved
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'cleanup-old-notifications': {
        const { days_old = 90 } = data
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days_old)

        const { data: deleted, error } = await supabase
          .from('notifications')
          .delete()
          .eq('is_read', true)
          .lt('created_at', cutoffDate.toISOString())
          .select('id')

        console.log(`[Scheduled Tasks] Deleted ${deleted?.length || 0} old notifications`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'cleanup-old-notifications',
            deleted: deleted?.length || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'contract-expiry-check': {
        const warningDays = [30, 14, 7, 3, 1]
        let totalNotifications = 0

        for (const days of warningDays) {
          const targetDate = new Date()
          targetDate.setDate(targetDate.getDate() + days)
          const dateStr = targetDate.toISOString().split('T')[0]

          const { data: contracts } = await supabase
            .from('contracts')
            .select('id, title, organization_id, end_date')
            .eq('end_date', dateStr)
            .eq('status', 'active')

          for (const contract of contracts || []) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('organization_id', contract.organization_id)
              .eq('is_active', true)

            const notifications = (profiles || []).map(p => ({
              user_id: p.user_id,
              title: days === 1 ? '🚨 عقد ينتهي غداً!' : `📋 تنبيه انتهاء عقد (${days} يوم)`,
              message: `العقد "${contract.title}" سينتهي خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}`,
              type: 'contract_expiry',
              is_read: false
            }))

            if (notifications.length > 0) {
              await supabase.from('notifications').insert(notifications)
              totalNotifications += notifications.length
            }
          }
        }

        console.log(`[Scheduled Tasks] Contract expiry notifications: ${totalNotifications}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'contract-expiry-check',
            notifications_sent: totalNotifications
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'driver-license-expiry': {
        const warningDays = [30, 7, 1]
        let totalNotifications = 0

        for (const days of warningDays) {
          const targetDate = new Date()
          targetDate.setDate(targetDate.getDate() + days)
          const dateStr = targetDate.toISOString().split('T')[0]

          const { data: drivers } = await supabase
            .from('drivers')
            .select('id, profile_id, license_expiry, profiles(user_id, full_name)')
            .eq('license_expiry', dateStr)

          for (const driver of drivers || []) {
            const profileData = driver.profiles as unknown as { user_id: string; full_name: string } | null
            if (profileData?.user_id) {
              await supabase.from('notifications').insert({
                user_id: profileData.user_id,
                title: days === 1 ? '🚨 رخصة القيادة تنتهي غداً!' : `🚗 تنبيه انتهاء الرخصة (${days} يوم)`,
                message: `رخصة القيادة ستنتهي خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}. يرجى التجديد.`,
                type: 'license_expiry',
                is_read: false
              })
              totalNotifications++
            }
          }
        }

        console.log(`[Scheduled Tasks] Driver license expiry notifications: ${totalNotifications}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'driver-license-expiry',
            notifications_sent: totalNotifications
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'invoice-overdue-check': {
        const today = new Date().toISOString().split('T')[0]

        // Update overdue invoices
        const { data: overdueInvoices } = await supabase
          .from('invoices')
          .update({ status: 'overdue', updated_at: new Date().toISOString() })
          .lt('due_date', today)
          .in('status', ['pending', 'partial'])
          .select('id, invoice_number, organization_id, total_amount')

        let totalNotifications = 0

        for (const invoice of overdueInvoices || []) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('organization_id', invoice.organization_id)
            .eq('is_active', true)

          const notifications = (profiles || []).map(p => ({
            user_id: p.user_id,
            title: '💰 فاتورة متأخرة السداد',
            message: `الفاتورة ${invoice.invoice_number} بقيمة ${invoice.total_amount} متأخرة السداد`,
            type: 'invoice_overdue',
            is_read: false
          }))

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
            totalNotifications += notifications.length
          }
        }

        console.log(`[Scheduled Tasks] Overdue invoices: ${overdueInvoices?.length || 0}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'invoice-overdue-check',
            overdue_invoices: overdueInvoices?.length || 0,
            notifications_sent: totalNotifications
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update-partner-stats': {
        // Update partner balances based on shipments
        const { data: organizations } = await supabase
          .from('organizations')
          .select('id')

        let updated = 0
        for (const org of organizations || []) {
          // Count shipments as different roles
          const { count: asGenerator } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('generator_id', org.id)
            .eq('status', 'confirmed')

          const { count: asTransporter } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('transporter_id', org.id)
            .eq('status', 'confirmed')

          const { count: asRecycler } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('recycler_id', org.id)
            .eq('status', 'confirmed')

          const totalShipments = (asGenerator || 0) + (asTransporter || 0) + (asRecycler || 0)

          if (totalShipments > 0) {
            await supabase
              .from('organizations')
              .update({ 
                shipments_count: totalShipments,
                updated_at: new Date().toISOString()
              })
              .eq('id', org.id)
            updated++
          }
        }

        console.log(`[Scheduled Tasks] Updated stats for ${updated} organizations`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'update-partner-stats',
            organizations_updated: updated
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'archive-old-data': {
        // أرشفة البيانات القديمة تلقائياً
        console.log('[Scheduled Tasks] Running data archival...')
        
        const { data: result, error } = await supabase
          .rpc('run_full_archive')

        if (error) {
          console.error('[Scheduled Tasks] Archive error:', error)
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`[Scheduled Tasks] Archived ${result?.total_archived || 0} records`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'archive-old-data',
            ...result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'refresh-materialized-views': {
        // تحديث الـ Materialized Views
        console.log('[Scheduled Tasks] Refreshing materialized views...')
        
        const { error } = await supabase
          .rpc('refresh_all_materialized_views')

        if (error) {
          console.error('[Scheduled Tasks] Refresh error:', error)
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('[Scheduled Tasks] Materialized views refreshed successfully')

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'refresh-materialized-views',
            refreshed_at: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'security-audit': {
        // فحص أمني دوري شامل
        console.log('[Scheduled Tasks] Running security audit...')
        
        const { data: result, error } = await supabase
          .rpc('run_security_audit')

        if (error) {
          console.error('[Scheduled Tasks] Security audit error:', error)
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`[Scheduled Tasks] Security audit completed: ${result?.status}`)

        // إرسال تنبيه إذا كان هناك فشل
        if (result?.failed > 0) {
          // إنشاء إشعار للمسؤولين
          const { data: admins } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('role', 'admin')
            .eq('is_active', true)

          const notifications = (admins || []).map(a => ({
            user_id: a.user_id,
            title: '🚨 تنبيه أمني: فشل في الفحص الدوري',
            message: `تم اكتشاف ${result.failed} مشكلة أمنية تحتاج مراجعة فورية`,
            type: 'security_alert',
            is_read: false
          }))

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'security-audit',
            ...result
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'generate-financial-reports': {
        // توليد التقارير المالية الشهرية تلقائياً لكل جهة
        console.log('[Scheduled Tasks] Generating monthly financial reports...')
        
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')

        let reportsGenerated = 0
        const now = new Date()
        const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0) // last day of prev month
        const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1) // first day of prev month

        for (const org of orgs || []) {
          // Get posted journal entries for the period
          const { data: entries } = await supabase
            .from('erp_journal_entries')
            .select('id')
            .eq('organization_id', org.id)
            .eq('status', 'posted')
            .gte('entry_date', periodStart.toISOString().split('T')[0])
            .lte('entry_date', periodEnd.toISOString().split('T')[0])

          if (!entries?.length) continue

          const entryIds = entries.map(e => e.id)
          const { data: lines } = await supabase
            .from('erp_journal_lines')
            .select('*, erp_chart_of_accounts!inner(account_code, account_name, account_type)')
            .in('journal_entry_id', entryIds)

          if (!lines?.length) continue

          // Build report data
          const accountMap = new Map()
          lines.forEach((line: any) => {
            const acc = line.erp_chart_of_accounts
            const key = line.account_id
            const existing = accountMap.get(key) || { name: acc.account_name, type: acc.account_type, debit: 0, credit: 0 }
            existing.debit += Number(line.debit) || 0
            existing.credit += Number(line.credit) || 0
            accountMap.set(key, existing)
          })

          const revenues: any[] = []
          const expenses: any[] = []
          accountMap.forEach((v: any) => {
            if (v.type === 'revenue') revenues.push({ account_name: v.name, amount: v.credit - v.debit })
            if (v.type === 'expense') expenses.push({ account_name: v.name, amount: v.debit - v.credit })
          })

          const reportData = {
            income_statement: {
              revenues,
              expenses,
              total_revenue: revenues.reduce((s: number, r: any) => s + r.amount, 0),
              total_expenses: expenses.reduce((s: number, e: any) => s + e.amount, 0),
              net_income: revenues.reduce((s: number, r: any) => s + r.amount, 0) - expenses.reduce((s: number, e: any) => s + e.amount, 0),
            },
            generated_automatically: true,
            generated_at: new Date().toISOString(),
          }

          // Save each report type
          for (const reportType of ['income_statement', 'balance_sheet', 'cash_flow']) {
            await supabase.from('erp_financial_reports').insert({
              organization_id: org.id,
              report_type: reportType,
              period_start: periodStart.toISOString().split('T')[0],
              period_end: periodEnd.toISOString().split('T')[0],
              report_data: reportData,
            })
          }
          reportsGenerated++

          // Notify org members
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('organization_id', org.id)
            .eq('is_active', true)

          const notifications = (profiles || []).map((p: any) => ({
            user_id: p.user_id,
            title: '📊 تقارير مالية شهرية جاهزة',
            message: `تم توليد التقارير المالية للفترة ${periodStart.toISOString().split('T')[0]} إلى ${periodEnd.toISOString().split('T')[0]}`,
            type: 'financial_report',
            is_read: false
          }))

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
          }
        }

        console.log(`[Scheduled Tasks] Generated reports for ${reportsGenerated} organizations`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            task: 'generate-financial-reports',
            organizations_processed: reportsGenerated
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'calculate-monthly-cogs': {
        // حساب تكلفة البضاعة المباعة شهرياً لكل جهة
        console.log('[Scheduled Tasks] Calculating monthly COGS...')
        
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')

        let processed = 0
        const now = new Date()
        const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1)

        for (const org of orgs || []) {
          // Get stock movements for the period
          const { data: movements } = await supabase
            .from('erp_stock_movements')
            .select('movement_type, quantity, unit_cost')
            .eq('organization_id', org.id)
            .gte('created_at', periodStart.toISOString())
            .lte('created_at', periodEnd.toISOString() + 'T23:59:59')

          if (!movements?.length) continue

          const inbound = movements.filter(m => m.movement_type === 'in' || m.movement_type === 'purchase')
          const outbound = movements.filter(m => m.movement_type === 'out' || m.movement_type === 'sale')

          const purchases = inbound.reduce((s, m) => s + (Number(m.quantity) || 0) * (Number(m.unit_cost) || 0), 0)
          const totalInQty = inbound.reduce((s, m) => s + (Number(m.quantity) || 0), 0)
          const avgCost = totalInQty > 0 ? purchases / totalInQty : 0
          const soldQty = outbound.reduce((s, m) => s + (Number(m.quantity) || 0), 0)
          const cogs = soldQty * avgCost

          // Get revenue
          const { data: entries } = await supabase
            .from('erp_journal_entries')
            .select('id')
            .eq('organization_id', org.id)
            .eq('status', 'posted')
            .gte('entry_date', periodStart.toISOString().split('T')[0])
            .lte('entry_date', periodEnd.toISOString().split('T')[0])

          let revenue = 0
          if (entries?.length) {
            const { data: lines } = await supabase
              .from('erp_journal_lines')
              .select('debit, credit, erp_chart_of_accounts!inner(account_type)')
              .in('journal_entry_id', entries.map(e => e.id))
            revenue = (lines || []).reduce((s: number, l: any) => {
              if (l.erp_chart_of_accounts.account_type === 'revenue')
                return s + ((Number(l.credit) || 0) - (Number(l.debit) || 0))
              return s
            }, 0)
          }

          const grossProfit = revenue - cogs
          const margin = revenue > 0 ? (grossProfit / revenue * 100) : 0

          await supabase.from('erp_cogs_records').insert({
            organization_id: org.id,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            opening_inventory: 0,
            purchases,
            closing_inventory: 0,
            cogs,
            revenue,
            gross_profit: grossProfit,
            gross_profit_margin: margin,
            valuation_method: 'weighted_average',
            generated_automatically: true,
          })
          processed++

          // Alert if low margin
          if (margin < 15 && margin > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('organization_id', org.id)
              .eq('is_active', true)

            const notifications = (profiles || []).map((p: any) => ({
              user_id: p.user_id,
              title: '⚠️ تنبيه: هامش ربح منخفض',
              message: `هامش الربح الإجمالي للشهر الماضي ${margin.toFixed(1)}% وهو أقل من 15%. يرجى مراجعة الأسعار.`,
              type: 'low_margin_alert',
              is_read: false
            }))
            if (notifications.length > 0) {
              await supabase.from('notifications').insert(notifications)
            }
          }
        }

        console.log(`[Scheduled Tasks] COGS calculated for ${processed} organizations`)

        return new Response(
          JSON.stringify({ success: true, task: 'calculate-monthly-cogs', processed }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid task',
            available_tasks: [
              'auto-approve-shipments',
              'cleanup-old-notifications',
              'contract-expiry-check',
              'driver-license-expiry',
              'invoice-overdue-check',
              'update-partner-stats',
              'archive-old-data',
              'refresh-materialized-views',
              'security-audit',
              'generate-financial-reports',
              'calculate-monthly-cogs'
            ]
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('[Scheduled Tasks] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
