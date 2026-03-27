import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Web Push helpers – pure Deno, no npm dependency.
 * Uses VAPID (Voluntary Application Server Identification) with ECDSA P-256.
 */

// ===== FCM (Firebase Cloud Messaging) v1 API Helper =====
interface FCMPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

let _fcmAccessToken: string | null = null;
let _fcmTokenExpiry = 0;

async function getFCMAccessToken(): Promise<string | null> {
  if (_fcmAccessToken && Date.now() < _fcmTokenExpiry) return _fcmAccessToken;

  const serviceAccountRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!serviceAccountRaw) return null;

  try {
    const sa = JSON.parse(serviceAccountRaw);
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;

    // Create JWT for Google OAuth2
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const claimSet = btoa(JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp,
    })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const unsignedToken = `${header}.${claimSet}`;

    // Import RSA private key
    const pemBody = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s/g, "");
    const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey("pkcs8", keyData, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);

    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(unsignedToken));
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const jwt = `${unsignedToken}.${sig}`;

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    if (!tokenRes.ok) {
      console.error("[FCM] Token exchange failed:", await tokenRes.text());
      return null;
    }

    const tokenData = await tokenRes.json();
    _fcmAccessToken = tokenData.access_token;
    _fcmTokenExpiry = Date.now() + (tokenData.expires_in - 60) * 1000;
    return _fcmAccessToken;
  } catch (err) {
    console.error("[FCM] Auth error:", err);
    return null;
  }
}

async function sendFCMNotification(fcmToken: string, payload: FCMPayload): Promise<{ success: boolean; error?: string }> {
  const accessToken = await getFCMAccessToken();
  if (!accessToken) return { success: false, error: "fcm_auth_failed" };

  try {
    const res = await fetch("https://fcm.googleapis.com/v1/projects/irecycle-waste-management/messages:send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title: payload.title, body: payload.body },
          data: payload.data || {},
          webpush: {
            notification: { icon: "/favicon.png", badge: "/favicon.png", dir: "rtl", lang: "ar" },
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const isExpired = errText.includes("NOT_FOUND") || errText.includes("UNREGISTERED");
      return { success: false, error: isExpired ? "subscription_expired" : `fcm_${res.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

function isFCMSubscription(sub: any): boolean {
  return sub.endpoint?.startsWith("fcm_token://") || sub.auth_key === "fcm";
}

function getFCMToken(sub: any): string {
  return sub.p256dh; // FCM token stored in p256dh field
}

function base64UrlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const pubRaw = base64UrlDecode(publicKeyB64);
  const privRaw = base64UrlDecode(privateKeyB64);
  const x = base64UrlEncode(pubRaw.slice(1, 33));
  const y = base64UrlEncode(pubRaw.slice(33, 65));
  const d = base64UrlEncode(privRaw);
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  return { privateKey, publicKeyRaw: pubRaw };
}

async function createVapidAuthHeader(
  endpoint: string, vapidPublicKey: string, vapidPrivateKey: string, subject: string
) {
  const { privateKey, publicKeyRaw } = await importVapidKeys(vapidPublicKey, vapidPrivateKey);
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ aud, exp, sub: subject })));
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(unsigned)
  );
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32); s = sigBytes.slice(32, 64);
  } else {
    const rLen = sigBytes[3]; const rStart = 4;
    r = sigBytes.slice(rStart, rStart + rLen);
    const sLen = sigBytes[rStart + rLen + 1]; const sStart = rStart + rLen + 2;
    s = sigBytes.slice(sStart, sStart + sLen);
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const p = new Uint8Array(32); p.set(r, 32 - r.length); r = p; }
    if (s.length < 32) { const p = new Uint8Array(32); p.set(s, 32 - s.length); s = p; }
  }
  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0); rawSig.set(s, 32);
  const jwt = `${unsigned}.${base64UrlEncode(rawSig)}`;
  const p256ecdsa = base64UrlEncode(publicKeyRaw);
  return { authorization: `vapid t=${jwt}, k=${p256ecdsa}` };
}

async function encryptPayload(p256dhB64: string, authB64: string, payload: Uint8Array) {
  const clientPublicKey = base64UrlDecode(p256dhB64);
  const clientAuth = base64UrlDecode(authB64);
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const clientKey = await crypto.subtle.importKey("raw", clientPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeys.privateKey, 256));
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk = await hkdfExtract(clientAuth, sharedSecret);
  const ikm = await hkdfExpand(prk, authInfo, 32);
  const context = createContext(clientPublicKey, serverPublicKeyRaw);
  const cekInfo = createInfo("aesgcm", context);
  const nonceInfo = createInfo("nonce", context);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk2 = await hkdfExtract(salt, ikm);
  const contentKey = await hkdfExpand(prk2, cekInfo, 16);
  const nonce = await hkdfExpand(prk2, nonceInfo, 12);
  const paddedPayload = new Uint8Array(2 + payload.length);
  paddedPayload[0] = 0; paddedPayload[1] = 0;
  paddedPayload.set(payload, 2);
  const key = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, paddedPayload));
  return { ciphertext: encrypted, salt, serverPublicKey: serverPublicKeyRaw };
}

function createContext(clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const label = new TextEncoder().encode("P-256\0");
  const context = new Uint8Array(label.length + 1 + 2 + clientPublicKey.length + 2 + serverPublicKey.length);
  let offset = 0;
  context.set(label, offset); offset += label.length;
  context[offset++] = 0; context[offset++] = clientPublicKey.length & 0xff;
  context.set(clientPublicKey, offset); offset += clientPublicKey.length;
  context[offset++] = 0; context[offset++] = serverPublicKey.length & 0xff;
  context.set(serverPublicKey, offset);
  return context;
}

function createInfo(type: string, context: Uint8Array): Uint8Array {
  const label = new TextEncoder().encode(`Content-Encoding: ${type}\0`);
  const info = new Uint8Array(label.length + context.length);
  info.set(label); info.set(context, label.length);
  return info;
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", salt.length ? salt : new Uint8Array(32), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info); infoWithCounter[info.length] = 1;
  const output = new Uint8Array(await crypto.subtle.sign("HMAC", key, infoWithCounter));
  return output.slice(0, length);
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string, vapidPublicKey: string, vapidPrivateKey: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const payloadBytes = new TextEncoder().encode(payload);
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(subscription.p256dh, subscription.auth, payloadBytes);
    const vapidHeaders = await createVapidAuthHeader(subscription.endpoint, vapidPublicKey, vapidPrivateKey, "mailto:admin@irecycle.app");
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        ...vapidHeaders,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aesgcm",
        "Crypto-Key": `dh=${base64UrlEncode(serverPublicKey)};p256ecdsa=${base64UrlEncode(base64UrlDecode(vapidPublicKey))}`,
        Encryption: `salt=${base64UrlEncode(salt)}`,
        TTL: "86400",
        Urgency: "high",
      },
      body: ciphertext,
    });
    if (response.status === 410 || response.status === 404) {
      return { success: false, status: response.status, error: "subscription_expired" };
    }
    return { success: response.ok, status: response.status };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ===== Main Handler =====
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FALLBACK_PUBLIC = "BGUbGLdxCbsZR7ZZQNdZAkpusnhxFrYdQcKSh1oBorhVSeJC7GWb2jTLX17YW40gRn7EWJp0wLe4847KtgGXHcs";
    const FALLBACK_PRIVATE = "lVe3qnCIT_3r1JUj0h8NRCvCc3vko0cUBRZXuhh_w7g";
    
    let vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    let vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    
    if (vapidPublicKey.length < 40) {
      console.log("[send-push] VAPID env key corrupted, using fallback");
      vapidPublicKey = FALLBACK_PUBLIC;
      vapidPrivateKey = FALLBACK_PRIVATE;
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    // ===== Campaign Action =====
    if (action === "campaign") {
      const { sender_id, title, body: msgBody, type, priority, target_type, target_ids, target_org_type, url, scheduled_at, template_id } = body;

      if (!title || !msgBody) {
        return new Response(
          JSON.stringify({ error: "title and body required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get blacklisted user IDs
      const { data: blacklisted } = await supabase.from("push_blacklist").select("user_id");
      const blacklistedIds = new Set((blacklisted || []).map((b: any) => b.user_id));

      // Determine target user IDs based on target_type
      let targetUserIds: string[] = [];

      if (target_type === "specific" && target_ids?.length) {
        targetUserIds = target_ids;
      } else if (target_type === "org_type" && target_org_type) {
        const { data: members } = await supabase
          .from("organization_members")
          .select("user_id, organizations!inner(organization_type)")
          .eq("organizations.organization_type", target_org_type)
          .eq("status", "active");
        targetUserIds = [...new Set((members || []).map((m: any) => m.user_id))];
      } else if (target_type === "organization" && target_ids?.length) {
        const { data: members } = await supabase
          .from("organization_members")
          .select("user_id")
          .in("organization_id", target_ids)
          .eq("status", "active");
        targetUserIds = [...new Set((members || []).map((m: any) => m.user_id))];
      } else {
        const { data: allSubs } = await supabase.from("push_subscriptions").select("user_id");
        targetUserIds = [...new Set((allSubs || []).map((s: any) => s.user_id))];
      }

      // Filter out blacklisted
      targetUserIds = targetUserIds.filter(id => !blacklistedIds.has(id));

      if (!targetUserIds.length) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No eligible recipients" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create campaign record first
      const campaignStatus = scheduled_at ? 'scheduled' : 'sent';
      const { data: campaignRecord, error: campError } = await supabase.from("push_campaigns").insert({
        sender_id: sender_id || null,
        title, body: msgBody, type, priority,
        target_type, target_ids, target_org_type,
        total_sent: 0, total_failed: 0, url,
        status: campaignStatus,
        scheduled_at: scheduled_at || null,
        template_id: template_id || null,
      } as any).select('id').single();

      const campaignId = campaignRecord?.id;

      // If scheduled, don't send now
      if (scheduled_at) {
        // Insert recipient records as pending
        const recipientRows = targetUserIds.map(uid => ({
          campaign_id: campaignId,
          user_id: uid,
          status: 'pending',
        }));
        for (let i = 0; i < recipientRows.length; i += 100) {
          await supabase.from("push_campaign_recipients").insert(recipientRows.slice(i, i + 100) as any);
        }
        return new Response(
          JSON.stringify({ scheduled: true, campaign_id: campaignId, recipients: targetUserIds.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch subscriptions for target users
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", targetUserIds);

      if (!subscriptions?.length) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No subscriptions found for targets" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = JSON.stringify({ title, body: msgBody, data: { url, type, priority }, tag: `campaign-${Date.now()}` });
      const expiredEndpoints: string[] = [];
      let sent = 0;
      let failed = 0;

      // Track per-user results
      const userResults: Record<string, { status: string; error?: string }> = {};

      await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
          let result: { success: boolean; error?: string };
          if (isFCMSubscription(sub)) {
            const parsedPayload = JSON.parse(payload);
            result = await sendFCMNotification(getFCMToken(sub), { title: parsedPayload.title, body: parsedPayload.body, data: parsedPayload.data });
          } else {
            result = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth_key },
              payload, vapidPublicKey, vapidPrivateKey
            );
          }
          if (result.success) {
            sent++;
            userResults[sub.user_id] = { status: 'sent' };
          } else if (result.error === "subscription_expired") {
            expiredEndpoints.push(sub.endpoint);
            failed++;
            if (!userResults[sub.user_id] || userResults[sub.user_id].status !== 'sent') {
              userResults[sub.user_id] = { status: 'failed', error: 'subscription_expired' };
            }
          } else {
            failed++;
            if (!userResults[sub.user_id] || userResults[sub.user_id].status !== 'sent') {
              userResults[sub.user_id] = { status: 'failed', error: result.error };
            }
          }
        })
      );

      // Cleanup expired
      if (expiredEndpoints.length) {
        await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
      }

      // Save recipient tracking
      if (campaignId) {
        const recipientRows = targetUserIds.map(uid => ({
          campaign_id: campaignId,
          user_id: uid,
          status: userResults[uid]?.status || 'failed',
          error_message: userResults[uid]?.error || null,
          delivered_at: userResults[uid]?.status === 'sent' ? new Date().toISOString() : null,
        }));
        for (let i = 0; i < recipientRows.length; i += 100) {
          await supabase.from("push_campaign_recipients").insert(recipientRows.slice(i, i + 100) as any);
        }
        // Update campaign totals
        await supabase.from("push_campaigns").update({
          total_sent: sent, total_failed: failed, status: 'sent',
        } as any).eq("id", campaignId);
      }

      // Also create in-app notifications for each user
      const notifRows = targetUserIds.map(uid => ({
        user_id: uid, title, message: msgBody, type: type || "general", is_read: false,
      }));
      for (let i = 0; i < notifRows.length; i += 100) {
        await supabase.from("notifications").insert(notifRows.slice(i, i + 100) as any);
      }

      return new Response(
        JSON.stringify({ sent, failed, total: subscriptions.length, expired: expiredEndpoints.length, campaign_id: campaignId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Retry Failed Action =====
    if (action === "retry_failed") {
      const { campaign_id } = body;
      if (!campaign_id) {
        return new Response(
          JSON.stringify({ error: "campaign_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get failed recipients
      const { data: failedRecipients } = await supabase
        .from("push_campaign_recipients")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("status", "failed");

      if (!failedRecipients?.length) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No failed recipients to retry" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get campaign info
      const { data: campaign } = await supabase
        .from("push_campaigns")
        .select("*")
        .eq("id", campaign_id)
        .single();

      if (!campaign) {
        return new Response(
          JSON.stringify({ error: "Campaign not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const failedUserIds = failedRecipients.map((r: any) => r.user_id);
      
      // Check blacklist
      const { data: bl } = await supabase.from("push_blacklist").select("user_id").in("user_id", failedUserIds);
      const blSet = new Set((bl || []).map((b: any) => b.user_id));
      const retryUserIds = failedUserIds.filter((id: string) => !blSet.has(id));

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", retryUserIds);

      if (!subscriptions?.length) {
        return new Response(
          JSON.stringify({ sent: 0, message: "No active subscriptions for failed users" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = JSON.stringify({
        title: campaign.title,
        body: campaign.body,
        data: { url: campaign.url, type: campaign.type, priority: campaign.priority },
        tag: `retry-${campaign_id}`,
      });

      let sent = 0;
      let failed = 0;
      const expiredEndpoints: string[] = [];

      await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
          let result: { success: boolean; error?: string; status?: number };
          if (isFCMSubscription(sub)) {
            const fcmToken = getFCMToken(sub);
            const parsedPayload = JSON.parse(payload);
            result = await sendFCMNotification(fcmToken, { title: parsedPayload.title, body: parsedPayload.body, data: parsedPayload.data });
          } else {
            result = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth_key },
              payload, vapidPublicKey, vapidPrivateKey
            );
          }
          if (result.success) {
            sent++;
            await supabase.from("push_campaign_recipients")
              .update({ status: 'sent', delivered_at: new Date().toISOString(), error_message: null } as any)
              .eq("campaign_id", campaign_id)
              .eq("user_id", sub.user_id);
          } else if (result.error === "subscription_expired") {
            expiredEndpoints.push(sub.endpoint);
            failed++;
          } else {
            failed++;
            await supabase.from("push_campaign_recipients")
              .update({ error_message: result.error } as any)
              .eq("campaign_id", campaign_id)
              .eq("user_id", sub.user_id);
          }
        })
      );

      if (expiredEndpoints.length) {
        await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
      }

      // Update campaign totals
      const { data: updatedRecipients } = await supabase
        .from("push_campaign_recipients")
        .select("status")
        .eq("campaign_id", campaign_id);
      
      const totalSent = (updatedRecipients || []).filter((r: any) => r.status === 'sent').length;
      const totalFailed = (updatedRecipients || []).filter((r: any) => r.status === 'failed').length;
      
      await supabase.from("push_campaigns").update({
        total_sent: totalSent, total_failed: totalFailed,
      } as any).eq("id", campaign_id);

      return new Response(
        JSON.stringify({ sent, failed, retried: failedRecipients.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Process Scheduled Campaigns (Cron) =====
    if (action === "process_scheduled") {
      const now = new Date().toISOString();
      const { data: scheduledCampaigns } = await supabase
        .from("push_campaigns")
        .select("*")
        .eq("status", "scheduled")
        .lte("scheduled_at", now);

      if (!scheduledCampaigns?.length) {
        return new Response(
          JSON.stringify({ processed: 0, message: "No scheduled campaigns due" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let totalProcessed = 0;
      for (const campaign of scheduledCampaigns) {
        // Get pending recipients
        const { data: recipients } = await supabase
          .from("push_campaign_recipients")
          .select("user_id")
          .eq("campaign_id", campaign.id)
          .eq("status", "pending");

        const userIds = (recipients || []).map((r: any) => r.user_id);
        if (!userIds.length) {
          await supabase.from("push_campaigns").update({ status: "sent", total_sent: 0, total_failed: 0 } as any).eq("id", campaign.id);
          totalProcessed++;
          continue;
        }

        // Check blacklist
        const { data: bl } = await supabase.from("push_blacklist").select("user_id").in("user_id", userIds);
        const blSet = new Set((bl || []).map((b: any) => b.user_id));
        const eligibleIds = userIds.filter((id: string) => !blSet.has(id));

        const { data: subs } = await supabase.from("push_subscriptions").select("*").in("user_id", eligibleIds);
        const payload = JSON.stringify({
          title: campaign.title, body: campaign.body,
          data: { url: campaign.url, type: campaign.type, priority: campaign.priority },
          tag: `scheduled-${campaign.id}`,
        });

        let sent = 0, failed = 0;
        const expiredEndpoints: string[] = [];
        const userResults: Record<string, { status: string; error?: string }> = {};

        await Promise.allSettled(
          (subs || []).map(async (sub: any) => {
            let result: { success: boolean; error?: string; status?: number };
            if (isFCMSubscription(sub)) {
              const fcmToken = getFCMToken(sub);
              const parsedPayload = JSON.parse(payload);
              result = await sendFCMNotification(fcmToken, { title: parsedPayload.title, body: parsedPayload.body, data: parsedPayload.data });
            } else {
              result = await sendPushNotification(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth_key },
                payload, vapidPublicKey, vapidPrivateKey
              );
            }
            if (result.success) {
              sent++;
              userResults[sub.user_id] = { status: "sent" };
            } else if (result.error === "subscription_expired") {
              expiredEndpoints.push(sub.endpoint);
              failed++;
              if (!userResults[sub.user_id] || userResults[sub.user_id].status !== "sent")
                userResults[sub.user_id] = { status: "failed", error: "subscription_expired" };
            } else {
              failed++;
              if (!userResults[sub.user_id] || userResults[sub.user_id].status !== "sent")
                userResults[sub.user_id] = { status: "failed", error: result.error };
            }
          })
        );

        if (expiredEndpoints.length) {
          await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
        }

        // Update recipients
        for (const uid of eligibleIds) {
          const res = userResults[uid] || { status: "failed", error: "no_subscription" };
          await supabase.from("push_campaign_recipients").update({
            status: res.status, error_message: res.error || null,
            delivered_at: res.status === "sent" ? new Date().toISOString() : null,
          } as any).eq("campaign_id", campaign.id).eq("user_id", uid);
        }

        // Mark blocked recipients
        for (const uid of userIds.filter((id: string) => blSet.has(id))) {
          await supabase.from("push_campaign_recipients").update({
            status: "failed", error_message: "blacklisted",
          } as any).eq("campaign_id", campaign.id).eq("user_id", uid);
        }

        // In-app notifications
        const notifRows = eligibleIds.map((uid: string) => ({
          user_id: uid, title: campaign.title, message: campaign.body,
          type: campaign.type || "general", is_read: false,
        }));
        for (let i = 0; i < notifRows.length; i += 100) {
          await supabase.from("notifications").insert(notifRows.slice(i, i + 100) as any);
        }

        await supabase.from("push_campaigns").update({
          total_sent: sent, total_failed: failed, status: "sent",
        } as any).eq("id", campaign.id);

        totalProcessed++;
      }

      return new Response(
        JSON.stringify({ processed: totalProcessed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Auto Cleanup Expired Subscriptions (Cron) =====
    if (action === "auto_cleanup") {
      // Test all subscriptions by checking if endpoint is still valid
      const { data: allSubs } = await supabase.from("push_subscriptions").select("*");
      if (!allSubs?.length) {
        return new Response(
          JSON.stringify({ cleaned: 0, total: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiredEndpoints: string[] = [];
      // Send a silent test push to check validity
      const testPayload = JSON.stringify({ title: "", body: "", silent: true });

      // Check in batches of 20
      for (let i = 0; i < allSubs.length; i += 20) {
        const batch = allSubs.slice(i, i + 20);
        await Promise.allSettled(
          batch.map(async (sub: any) => {
            if (isFCMSubscription(sub)) {
              // Validate FCM token by sending a silent data-only message
              const fcmToken = getFCMToken(sub);
              const result = await sendFCMNotification(fcmToken, { title: "", body: "", data: { silent: "true" } });
              if (result.error === "subscription_expired") {
                expiredEndpoints.push(sub.endpoint);
              }
              return;
            }
            const result = await sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth_key },
              testPayload, vapidPublicKey, vapidPrivateKey
            );
            if (result.error === "subscription_expired" || result.status === 410 || result.status === 404) {
              expiredEndpoints.push(sub.endpoint);
            }
          })
        );
      }

      if (expiredEndpoints.length) {
        await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
      }

      return new Response(
        JSON.stringify({ cleaned: expiredEndpoints.length, total: allSubs.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Auto Retry Failed (Cron) =====
    if (action === "auto_retry") {
      // Find campaigns sent in last 24h with failed recipients, max 3 retries
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentCampaigns } = await supabase
        .from("push_campaigns")
        .select("id, title, body, url, type, priority")
        .eq("status", "sent")
        .gte("created_at", oneDayAgo);

      if (!recentCampaigns?.length) {
        return new Response(
          JSON.stringify({ retried: 0, message: "No recent campaigns with failures" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let totalRetried = 0;
      for (const campaign of recentCampaigns) {
        const { data: failedRecips } = await supabase
          .from("push_campaign_recipients")
          .select("user_id")
          .eq("campaign_id", campaign.id)
          .eq("status", "failed")
          .neq("error_message", "subscription_expired")
          .neq("error_message", "blacklisted");

        if (!failedRecips?.length) continue;

        const failedIds = failedRecips.map((r: any) => r.user_id);
        const { data: bl } = await supabase.from("push_blacklist").select("user_id").in("user_id", failedIds);
        const blSet = new Set((bl || []).map((b: any) => b.user_id));
        const retryIds = failedIds.filter((id: string) => !blSet.has(id));

        const { data: subs } = await supabase.from("push_subscriptions").select("*").in("user_id", retryIds);
        if (!subs?.length) continue;

        const payload = JSON.stringify({
          title: campaign.title, body: campaign.body,
          data: { url: campaign.url, type: campaign.type, priority: campaign.priority },
          tag: `autoretry-${campaign.id}`,
        });

        await Promise.allSettled(
          subs.map(async (sub: any) => {
            let result: { success: boolean; error?: string; status?: number };
            if (isFCMSubscription(sub)) {
              const fcmToken = getFCMToken(sub);
              const parsedPayload = JSON.parse(payload);
              result = await sendFCMNotification(fcmToken, { title: parsedPayload.title, body: parsedPayload.body, data: parsedPayload.data });
            } else {
              result = await sendPushNotification(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth_key },
                payload, vapidPublicKey, vapidPrivateKey
              );
            }
            if (result.success) {
              await supabase.from("push_campaign_recipients").update({
                status: "sent", delivered_at: new Date().toISOString(), error_message: null,
              } as any).eq("campaign_id", campaign.id).eq("user_id", sub.user_id);
              totalRetried++;
            }
          })
        );

        // Recount
        const { data: allRecips } = await supabase
          .from("push_campaign_recipients").select("status").eq("campaign_id", campaign.id);
        const sentCount = (allRecips || []).filter((r: any) => r.status === "sent").length;
        const failCount = (allRecips || []).filter((r: any) => r.status === "failed").length;
        await supabase.from("push_campaigns").update({ total_sent: sentCount, total_failed: failCount } as any).eq("id", campaign.id);
      }

      return new Response(
        JSON.stringify({ retried: totalRetried }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== Default: Simple send (backward compatible) =====
    const { user_id, user_ids, title, body: msgBody2, data, tag } = body;
    const targetUserIds: string[] = user_ids || (user_id ? [user_id] : []);
    
    if (!targetUserIds.length) {
      return new Response(
        JSON.stringify({ error: "user_id or user_ids required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check blacklist even for simple sends
    const { data: bl } = await supabase.from("push_blacklist").select("user_id").in("user_id", targetUserIds);
    const blSet = new Set((bl || []).map((b: any) => b.user_id));
    const filteredIds = targetUserIds.filter(id => !blSet.has(id));

    if (!filteredIds.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "All targets are blacklisted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", filteredIds);

    if (subError) {
      return new Response(
        JSON.stringify({ error: subError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions found", targetUserIds: filteredIds }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({ title, body: msgBody2, data, tag });
    const expiredEndpoints: string[] = [];
    let sent = 0;
    const errors: any[] = [];

    console.log(`[send-push] Sending to ${subscriptions.length} subscriptions for ${filteredIds.length} users`);
    
    // Log subscription types
    const fcmCount = subscriptions.filter((s: any) => isFCMSubscription(s)).length;
    const vapidCount = subscriptions.length - fcmCount;
    console.log(`[send-push] FCM: ${fcmCount}, VAPID: ${vapidCount}`);

    await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        if (isFCMSubscription(sub)) {
          // Send via FCM
          const fcmToken = getFCMToken(sub);
          const parsedPayload = JSON.parse(payload);
          console.log(`[send-push] Sending FCM to user ${sub.user_id}, token: ${fcmToken.slice(0, 20)}...`);
          const result = await sendFCMNotification(fcmToken, { title: parsedPayload.title, body: parsedPayload.body, data: parsedPayload.data });
          console.log(`[send-push] FCM result for ${sub.user_id}:`, result.success ? 'OK' : result.error);
          if (result.success) { sent++; }
          else if (result.error === "subscription_expired") { expiredEndpoints.push(sub.endpoint); }
          else { errors.push({ endpoint: "fcm", error: result.error, user_id: sub.user_id }); }
        } else {
          // Send via VAPID Web Push
          console.log(`[send-push] Sending VAPID to user ${sub.user_id}, endpoint: ${sub.endpoint.slice(0, 60)}...`);
          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth_key },
            payload, vapidPublicKey, vapidPrivateKey
          );
          console.log(`[send-push] VAPID result for ${sub.user_id}:`, result.success ? 'OK' : `${result.error} (${result.status})`);
          if (result.success) { sent++; }
          else if (result.error === "subscription_expired") { expiredEndpoints.push(sub.endpoint); }
          else { errors.push({ endpoint: sub.endpoint.substring(0, 50), ...result }); }
        }
      })
    );

    console.log(`[send-push] Results: sent=${sent}, errors=${errors.length}, expired=${expiredEndpoints.length}`);
    if (errors.length) console.log(`[send-push] Errors:`, JSON.stringify(errors));

    if (expiredEndpoints.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
    }

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length, expired: expiredEndpoints.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
