import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ORG_ID = "c1000000-0000-0000-0000-000000000004";
const PASSWORD = "Demo@575757";

interface TeamMember {
  email: string;
  full_name: string;
  position_id: string;
  department: string;
  employee_type: string;
  role_in_org: string;
  permissions: string[];
}

const TEAM: TeamMember[] = [
  // CEO
  {
    email: "ceo@transporter.demo",
    full_name: "أحمد محمد السيد",
    position_id: "6c277dc9-7f25-4cd4-9c86-e8b77ad03ad0",
    department: "الإدارة العليا",
    employee_type: "admin",
    role_in_org: "admin",
    permissions: [
      "create_shipments","view_shipments","edit_shipments","delete_shipments","approve_shipments",
      "view_financials","create_invoices","approve_payments","manage_deposits",
      "manage_drivers","assign_drivers","track_vehicles",
      "manage_partners","view_partner_data",
      "manage_members","manage_settings",
      "view_reports","export_data",
      "sign_documents","issue_certificates","manage_templates","manage_contracts",
    ],
  },
  // Deputy GM
  {
    email: "deputy@transporter.demo",
    full_name: "محمود عبدالرحمن حسن",
    position_id: "ab2fd1d3-5a2e-413c-b578-0afdab7d6b4f",
    department: "الإدارة العليا",
    employee_type: "admin",
    role_in_org: "admin",
    permissions: [
      "create_shipments","view_shipments","edit_shipments","approve_shipments",
      "view_financials","create_invoices","approve_payments",
      "manage_drivers","assign_drivers","track_vehicles",
      "manage_partners","view_partner_data",
      "manage_members","manage_settings",
      "view_reports","export_data",
      "sign_documents","manage_contracts",
    ],
  },
  // Operations Director
  {
    email: "operations@transporter.demo",
    full_name: "عمرو حسين علي",
    position_id: "f2b75114-8514-4c18-92dc-137d38bfc0f2",
    department: "العمليات والتشغيل",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "create_shipments","view_shipments","edit_shipments","approve_shipments",
      "manage_drivers","assign_drivers","track_vehicles",
      "view_reports","export_data",
      "sign_documents",
    ],
  },
  // Fleet Manager
  {
    email: "fleet@transporter.demo",
    full_name: "مصطفى عادل رشدي",
    position_id: "f938ca5a-1470-4103-9c72-84c555813b10",
    department: "إدارة الأسطول",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "view_shipments",
      "manage_drivers","assign_drivers","track_vehicles",
      "view_reports",
    ],
  },
  // Finance Manager
  {
    email: "finance@transporter.demo",
    full_name: "ماجد فؤاد سليمان",
    position_id: "ae0a48ea-ae05-43aa-840e-cc1f5be00717",
    department: "المالية والمحاسبة",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "view_financials","create_invoices","approve_payments","manage_deposits",
      "view_reports","export_data",
      "sign_documents","manage_contracts",
    ],
  },
  // Sales Manager
  {
    email: "sales@transporter.demo",
    full_name: "سامح وليد أنور",
    position_id: "7220eca6-a85a-4ad6-acfe-4932ddef62d6",
    department: "التنمية التجارية والمبيعات",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "view_shipments","create_shipments",
      "manage_partners","view_partner_data",
      "view_reports",
      "manage_contracts",
    ],
  },
  // HR Manager
  {
    email: "hr@transporter.demo",
    full_name: "شريف كمال عبدالباقي",
    position_id: "fa88e8a8-4a6a-4156-be8f-a7497b374d98",
    department: "الموارد البشرية",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "manage_members","manage_settings",
      "view_reports","export_data",
      "manage_templates",
    ],
  },
  // IT Manager
  {
    email: "it@transporter.demo",
    full_name: "أحمد هشام نبيل",
    position_id: "b9a02ff3-fa5a-4055-86b8-62a77e5b4c51",
    department: "التكنولوجيا والأنظمة الذكية",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "manage_settings",
      "view_reports","export_data",
      "manage_templates",
    ],
  },
  // Compliance Manager
  {
    email: "compliance@transporter.demo",
    full_name: "هاني وجيه صبحي",
    position_id: "4bdca43e-8a80-41d7-bb9c-3249080be4c5",
    department: "الامتثال والسلامة والبيئة",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "view_shipments",
      "view_reports","export_data",
      "sign_documents","issue_certificates",
    ],
  },
  // Customer Service Manager
  {
    email: "cs@transporter.demo",
    full_name: "منى إبراهيم عطية",
    position_id: "1a3dcf9e-9b9b-4d04-8492-995386025aa3",
    department: "خدمة العملاء ومركز الاتصال",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "view_shipments",
      "view_partner_data",
      "view_reports",
    ],
  },
  // Fleet Supervisor
  {
    email: "fleet.supervisor@transporter.demo",
    full_name: "حسام فاروق عبدالله",
    position_id: "a131e0bd-c8cc-4870-8324-c760cf5f8f19",
    department: "العمليات والتشغيل",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "view_shipments",
      "assign_drivers","track_vehicles",
    ],
  },
  // Dispatcher
  {
    email: "dispatch@transporter.demo",
    full_name: "ياسر محمد توفيق",
    position_id: "a3d41e1a-b861-4c3d-8a31-e4ef78c646fc",
    department: "العمليات والتشغيل",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "view_shipments","create_shipments",
      "assign_drivers","track_vehicles",
    ],
  },
  // Chief Accountant
  {
    email: "accountant@transporter.demo",
    full_name: "رشا عبدالناصر كمال",
    position_id: "ba38d83d-415a-4f78-8115-e291bb9cd503",
    department: "المالية والمحاسبة",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "view_financials","create_invoices",
      "view_reports",
    ],
  },
  // Driver Head
  {
    email: "driver.head@transporter.demo",
    full_name: "عبدالله سامي جاد",
    position_id: "baea1a7b-12d1-4b28-a3d9-98631b302b3e",
    department: "شؤون السائقين والعمالة الميدانية",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "view_shipments",
      "manage_drivers","assign_drivers","track_vehicles",
    ],
  },
  // OHS Specialist
  {
    email: "safety@transporter.demo",
    full_name: "كريم طاهر محسن",
    position_id: "1983fa5c-6f0f-41c1-8f0c-1e25e4dd19e1",
    department: "الامتثال والسلامة والبيئة",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "view_shipments",
      "view_reports",
      "issue_certificates",
    ],
  },
  // Call Center Team Lead
  {
    email: "callcenter@transporter.demo",
    full_name: "هبة سعيد مصطفى",
    position_id: "9083a727-04f0-4a56-b353-741be0ef6fb3",
    department: "خدمة العملاء ومركز الاتصال",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "view_shipments",
      "view_partner_data",
    ],
  },
  // Data Analyst
  {
    email: "analyst@transporter.demo",
    full_name: "نورهان محمد عبدالفتاح",
    position_id: "4692d730-48d6-4795-b4a6-a6fe1bb58d57",
    department: "التكنولوجيا والأنظمة الذكية",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "view_shipments",
      "view_financials",
      "view_reports","export_data",
      "view_partner_data",
    ],
  },
  // Maintenance Supervisor
  {
    email: "maintenance@transporter.demo",
    full_name: "محمد جمال فوزي",
    position_id: "063f5a74-6bc1-4884-88f3-d2a1693a7dfb",
    department: "إدارة الأسطول",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "track_vehicles",
      "view_reports",
    ],
  },
  // Strategic Planning Manager
  {
    email: "strategy@transporter.demo",
    full_name: "خالد إبراهيم محمود",
    position_id: "ca47a0fa-41a0-42e1-98ab-206a235716c5",
    department: "الإدارة العليا",
    employee_type: "manager",
    role_in_org: "manager",
    permissions: [
      "view_shipments",
      "view_financials",
      "view_reports","export_data",
      "view_partner_data",
    ],
  },
  // Executive Assistant
  {
    email: "assistant@transporter.demo",
    full_name: "سارة أحمد عبدالعزيز",
    position_id: "421296b1-3f6a-4b82-af1a-eb28b12307cf",
    department: "الإدارة العليا",
    employee_type: "employee",
    role_in_org: "member",
    permissions: [
      "view_shipments",
      "view_reports",
      "sign_documents",
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: any[] = [];

    for (const member of TEAM) {
      try {
        // 1. Create auth user
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email: member.email,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: member.full_name },
          });

        if (authError) {
          // User might already exist
          if (authError.message?.includes("already been registered")) {
            // Get existing user
            const { data: users } = await supabase.auth.admin.listUsers();
            const existing = users?.users?.find((u) => u.email === member.email);
            if (existing) {
              // Check if profile exists
              const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("user_id", existing.id)
                .maybeSingle();

              if (existingProfile) {
                // Update existing profile
                await supabase
                  .from("profiles")
                  .update({
                    full_name: member.full_name,
                    organization_id: ORG_ID,
                    department: member.department,
                    employee_type: member.employee_type,
                    is_active: true,
                    email: member.email,
                  })
                  .eq("user_id", existing.id);
              } else {
                // Create profile if it doesn't exist
                await supabase.from("profiles").insert({
                  id: existing.id,
                  user_id: existing.id,
                  full_name: member.full_name,
                  organization_id: ORG_ID,
                  department: member.department,
                  employee_type: member.employee_type,
                  is_active: true,
                  email: member.email,
                });
              }

              // Upsert user_organizations
              await supabase.from("user_organizations").upsert(
                {
                  user_id: existing.id,
                  organization_id: ORG_ID,
                  role_in_organization: member.role_in_org,
                  is_primary: true,
                  is_active: true,
                },
                { onConflict: "user_id,organization_id" }
              );

              await supabase
                .from("organization_positions")
                .update({ assigned_user_id: existing.id })
                .eq("id", member.position_id);

              // Upsert employee_permissions
              for (const perm of member.permissions) {
                await supabase.from("employee_permissions").upsert(
                  {
                    profile_id: existing.id,
                    permission_type: perm,
                  },
                  { onConflict: "profile_id,permission_type" }
                );
              }

              results.push({
                email: member.email,
                status: "already_exists_updated",
                user_id: existing.id,
              });
              continue;
            }
          }
          results.push({
            email: member.email,
            status: "auth_error",
            error: authError.message,
          });
          continue;
        }

        const userId = authData.user!.id;

        // 2. Update profile
        await supabase
          .from("profiles")
          .update({
            full_name: member.full_name,
            organization_id: ORG_ID,
            department: member.department,
            employee_type: member.employee_type,
            is_active: true,
          })
          .eq("user_id", userId);

        // 3. Create user_organizations link
        await supabase.from("user_organizations").upsert(
          {
            user_id: userId,
            organization_id: ORG_ID,
            role_in_organization: member.role_in_org,
            is_primary: true,
            is_active: true,
          },
          { onConflict: "user_id,organization_id" }
        );

        // 4. Assign to position
        await supabase
          .from("organization_positions")
          .update({ assigned_user_id: userId })
          .eq("id", member.position_id);

        // 5. Create employee_permissions
        for (const perm of member.permissions) {
          await supabase.from("employee_permissions").upsert(
            {
              profile_id: userId,
              permission_type: perm,
            },
            { onConflict: "profile_id,permission_type" }
          );
        }

        results.push({
          email: member.email,
          status: "created",
          user_id: userId,
          permissions_count: member.permissions.length,
        });
      } catch (e: any) {
        results.push({
          email: member.email,
          status: "error",
          error: e.message,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
