/**
 * Database Backup Edge Function
 * يقوم بتصدير البيانات ورفعها إلى GitHub Repository
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tables to backup
const BACKUP_TABLES = [
  'profiles',
  'organizations',
  'shipments',
  'invoices',
  'deposits',
  'contracts',
  'award_letters',
  'external_partners',
  'customers',
  'drivers',
  'vehicles',
  'accounting_ledger',
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const githubToken = Deno.env.get("GITHUB_BACKUP_TOKEN");
    const githubRepo = Deno.env.get("GITHUB_BACKUP_REPO"); // format: owner/repo

    if (!githubToken || !githubRepo) {
      throw new Error("GitHub credentials not configured. Please set GITHUB_BACKUP_TOKEN and GITHUB_BACKUP_REPO secrets.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create backup log entry
    const { data: backupLog, error: logError } = await supabase
      .from("backup_logs")
      .insert({
        backup_type: "database",
        status: "in_progress",
        tables_backed_up: BACKUP_TABLES,
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create backup log:", logError);
    }

    // Collect data from all tables
    const backupData: Record<string, any[]> = {};
    let totalSize = 0;

    for (const table of BACKUP_TABLES) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .limit(10000); // Limit for safety

        if (error) {
          console.error(`Error backing up ${table}:`, error);
          backupData[table] = [];
        } else {
          backupData[table] = data || [];
        }
      } catch (e) {
        console.error(`Exception backing up ${table}:`, e);
        backupData[table] = [];
      }
    }

    // Create backup content
    const backupContent = {
      timestamp: new Date().toISOString(),
      tables: backupData,
      metadata: {
        tablesCount: BACKUP_TABLES.length,
        totalRecords: Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0),
      },
    };

    const jsonContent = JSON.stringify(backupContent, null, 2);
    totalSize = new Blob([jsonContent]).size;

    // Upload to GitHub
    const date = new Date();
    const fileName = `backup-${date.toISOString().split('T')[0]}-${date.getTime()}.json`;
    const filePath = `backups/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${fileName}`;

    // Get current file SHA if exists (for updating)
    let currentSha: string | undefined;
    try {
      const checkResponse = await fetch(
        `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        currentSha = checkData.sha;
      }
    } catch (e) {
      // File doesn't exist, which is fine
    }

    // Create/Update file on GitHub
    const githubPayload: any = {
      message: `🔄 Database backup - ${date.toISOString()}`,
      content: btoa(unescape(encodeURIComponent(jsonContent))),
      branch: "main",
    };

    if (currentSha) {
      githubPayload.sha = currentSha;
    }

    const githubResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(githubPayload),
      }
    );

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      throw new Error(`GitHub API error: ${errorText}`);
    }

    const githubResult = await githubResponse.json();

    // Update backup log
    if (backupLog?.id) {
      await supabase
        .from("backup_logs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          file_size_bytes: totalSize,
          github_commit_url: githubResult.commit?.html_url || null,
        })
        .eq("id", backupLog.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Backup completed successfully",
        commit_url: githubResult.commit?.html_url,
        file_path: filePath,
        size_bytes: totalSize,
        records_count: backupContent.metadata.totalRecords,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Backup error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
