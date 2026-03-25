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

  // Build JWK for private key
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
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
) {
  const { privateKey, publicKeyRaw } = await importVapidKeys(vapidPublicKey, vapidPrivateKey);

  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;

  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ aud, exp, sub: subject })));
  const unsigned = `${header}.${payload}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(unsigned)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32, 64);
  } else {
    // DER format
    const rLen = sigBytes[3];
    const rStart = 4;
    r = sigBytes.slice(rStart, rStart + rLen);
    const sLen = sigBytes[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    s = sigBytes.slice(sStart, sStart + sLen);
    // Pad/trim to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const p = new Uint8Array(32); p.set(r, 32 - r.length); r = p; }
    if (s.length < 32) { const p = new Uint8Array(32); p.set(s, 32 - s.length); s = p; }
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  const jwt = `${unsigned}.${base64UrlEncode(rawSig)}`;
  const p256ecdsa = base64UrlEncode(publicKeyRaw);

  return {
    authorization: `vapid t=${jwt}, k=${p256ecdsa}`,
  };
}

async function encryptPayload(
  p256dhB64: string,
  authB64: string,
  payload: Uint8Array
) {
  const clientPublicKey = base64UrlDecode(p256dhB64);
  const clientAuth = base64UrlDecode(authB64);

  // Generate ephemeral ECDH key pair
  const serverKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeys.publicKey)
  );

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Shared secret via ECDH
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      serverKeys.privateKey,
      256
    )
  );

  // HKDF for auth info
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk = await hkdfExtract(clientAuth, sharedSecret);
  const ikm = await hkdfExpand(prk, authInfo, 32);

  // Key and nonce info
  const context = createContext(clientPublicKey, serverPublicKeyRaw);
  const cekInfo = createInfo("aesgcm", context);
  const nonceInfo = createInfo("nonce", context);

  const prkFinal = await hkdfExtract(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "ECDH", public: clientKey },
        serverKeys.privateKey,
        256
      )
    ).buffer === sharedSecret.buffer ? sharedSecret : sharedSecret,
    ikm
  );

  // Actually re-derive properly
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk2 = await hkdfExtract(salt, ikm);
  const contentKey = await hkdfExpand(prk2, cekInfo, 16);
  const nonce = await hkdfExpand(prk2, nonceInfo, 12);

  // Pad payload
  const paddingLength = 0;
  const paddedPayload = new Uint8Array(2 + paddingLength + payload.length);
  paddedPayload[0] = (paddingLength >> 8) & 0xff;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payload, 2 + paddingLength);

  // Encrypt with AES-128-GCM
  const key = await crypto.subtle.importKey(
    "raw",
    contentKey,
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      key,
      paddedPayload
    )
  );

  return {
    ciphertext: encrypted,
    salt,
    serverPublicKey: serverPublicKeyRaw,
  };
}

function createContext(
  clientPublicKey: Uint8Array,
  serverPublicKey: Uint8Array
): Uint8Array {
  const label = new TextEncoder().encode("P-256\0");
  const context = new Uint8Array(
    label.length + 1 + 2 + clientPublicKey.length + 2 + serverPublicKey.length
  );
  let offset = 0;
  context.set(label, offset);
  offset += label.length;
  context[offset++] = 0;
  context[offset++] = clientPublicKey.length & 0xff;
  context.set(clientPublicKey, offset);
  offset += clientPublicKey.length;
  context[offset++] = 0;
  context[offset++] = serverPublicKey.length & 0xff;
  context.set(serverPublicKey, offset);
  return context;
}

function createInfo(type: string, context: Uint8Array): Uint8Array {
  const label = new TextEncoder().encode(`Content-Encoding: ${type}\0`);
  const info = new Uint8Array(label.length + context.length);
  info.set(label);
  info.set(context, label.length);
  return info;
}

async function hkdfExtract(
  salt: Uint8Array,
  ikm: Uint8Array
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    salt.length ? salt : new Uint8Array(32),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
}

async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const infoWithCounter = new Uint8Array(info.length + 1);
  infoWithCounter.set(info);
  infoWithCounter[info.length] = 1;
  const output = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, infoWithCounter)
  );
  return output.slice(0, length);
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const payloadBytes = new TextEncoder().encode(payload);
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(
      subscription.p256dh,
      subscription.auth,
      payloadBytes
    );

    const vapidHeaders = await createVapidAuthHeader(
      subscription.endpoint,
      vapidPublicKey,
      vapidPrivateKey,
      "mailto:admin@irecycle.app"
    );

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";

    console.log("[send-push] VAPID pub key first 10 chars:", vapidPublicKey.substring(0, 10), "len:", vapidPublicKey.length);

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

    const { user_id, user_ids, title, body, data, tag } = await req.json();

    const targetUserIds: string[] = user_ids || (user_id ? [user_id] : []);
    if (!targetUserIds.length) {
      return new Response(
        JSON.stringify({ error: "user_id or user_ids required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch subscriptions
    console.log("[send-push] Looking for subscriptions for users:", targetUserIds);
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", targetUserIds);

    console.log("[send-push] Query result:", { count: subscriptions?.length, error: subError?.message });

    if (subError) {
      return new Response(
        JSON.stringify({ error: subError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions found", targetUserIds }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({ title, body, data, tag });
    const expiredEndpoints: string[] = [];
    let sent = 0;

    const errors: any[] = [];
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        console.log("[send-push] Sending to endpoint:", sub.endpoint.substring(0, 60));
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth_key },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );
        console.log("[send-push] Result:", JSON.stringify(result));
        if (result.success) {
          sent++;
        } else if (result.error === "subscription_expired") {
          expiredEndpoints.push(sub.endpoint);
        } else {
          errors.push({ endpoint: sub.endpoint.substring(0, 50), ...result });
        }
      })
    );

    // Cleanup expired subscriptions
    if (expiredEndpoints.length) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
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
