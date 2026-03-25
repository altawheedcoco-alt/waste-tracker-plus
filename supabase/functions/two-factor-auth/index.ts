import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TOTP configuration
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const BACKUP_CODES_COUNT = 10;

// Simple Base32 encoding/decoding
const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Uint8Array): string {
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += base32Chars[(value << (5 - bits)) & 31];
  }

  return result;
}

function base32Decode(input: string): Uint8Array {
  const cleanInput = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleanInput) {
    const index = base32Chars.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

// Generate HMAC-SHA1
async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}

// Generate TOTP code
async function generateTOTP(secret: string, timestamp?: number): Promise<string> {
  const time = timestamp || Math.floor(Date.now() / 1000);
  const counter = Math.floor(time / TOTP_PERIOD);
  
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, BigInt(counter), false);
  
  const secretBytes = base32Decode(secret);
  const hmac = await hmacSha1(secretBytes, new Uint8Array(counterBuffer));
  
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = 
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

// Verify TOTP with time window
async function verifyTOTP(secret: string, code: string, window: number = 1): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = -window; i <= window; i++) {
    const timestamp = now + (i * TOTP_PERIOD);
    const expectedCode = await generateTOTP(secret, timestamp);
    if (expectedCode === code) {
      return true;
    }
  }
  
  return false;
}

// Generate secure random secret
function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

// Generate backup codes
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}

// AES-256-GCM encryption using Web Crypto API
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cryptoKey = await deriveKey(key, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    enc.encode(data)
  );
  // Format: "aesgcm:" + base64(salt + iv + ciphertext)
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return "aesgcm:" + btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedData: string, key: string): Promise<string> {
  // Handle legacy XOR-encrypted data (auto-migration)
  if (!encryptedData.startsWith("aesgcm:")) {
    return legacyXorDecrypt(encryptedData, key);
  }
  const raw = Uint8Array.from(atob(encryptedData.slice(7)), c => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const ciphertext = raw.slice(28);
  const cryptoKey = await deriveKey(key, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

// Legacy XOR decrypt for backward compatibility during migration
function legacyXorDecrypt(encryptedData: string, key: string): string {
  const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(key);
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TWO_FA_ENCRYPTION_KEY") || supabaseServiceKey.slice(0, 32);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Create user client for auth
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, code, backupCode } = await req.json();

    switch (action) {
      case "setup": {
        // Check rate limiting
        const { data: attempts } = await supabase.rpc("count_recent_2fa_attempts", {
          _user_id: user.id,
          _minutes: 15
        });
        
        if (attempts && attempts >= 5) {
          throw new Error("Too many attempts. Please try again later.");
        }

        // Generate new secret and backup codes
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();
        
        // Encrypt sensitive data
        const encryptedSecret = await encryptData(secret, encryptionKey);
        const encryptedBackupCodes = await encryptData(JSON.stringify(backupCodes), encryptionKey);

        // Store in database (not enabled yet)
        const { error: insertError } = await supabase
          .from("user_two_factor_auth")
          .upsert({
            user_id: user.id,
            secret_encrypted: encryptedSecret,
            backup_codes_encrypted: encryptedBackupCodes,
            is_enabled: false,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "user_id"
          });

        if (insertError) {
          throw insertError;
        }

        // Log attempt
        await supabase.from("two_factor_attempts").insert({
          user_id: user.id,
          attempt_type: "setup",
          is_successful: true,
          ip_address: req.headers.get("x-forwarded-for") || "unknown"
        });

        // Generate QR code URL (otpauth format)
        const issuer = "آي ريسايكل";
        const accountName = user.email || user.id;
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

        return new Response(
          JSON.stringify({
            success: true,
            secret,
            backupCodes,
            otpauthUrl
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify-setup": {
        // Get current 2FA settings
        const { data: settings, error: settingsError } = await supabase
          .from("user_two_factor_auth")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError || !settings) {
          throw new Error("2FA not set up. Please start setup first.");
        }

        if (settings.is_enabled) {
          throw new Error("2FA is already enabled.");
        }

        // Decrypt secret
        const secret = await decryptData(settings.secret_encrypted, encryptionKey);
        
        // Auto-upgrade legacy XOR encryption to AES-GCM
        if (!settings.secret_encrypted.startsWith("aesgcm:")) {
          const reEncryptedSecret = await encryptData(secret, encryptionKey);
          const backupCodesRaw = await decryptData(settings.backup_codes_encrypted, encryptionKey);
          const reEncryptedBackup = await encryptData(backupCodesRaw, encryptionKey);
          await supabase.from("user_two_factor_auth").update({
            secret_encrypted: reEncryptedSecret,
            backup_codes_encrypted: reEncryptedBackup,
            updated_at: new Date().toISOString()
          }).eq("user_id", user.id);
        }
        
        // Verify the provided code
        const isValid = await verifyTOTP(secret, code);
        
        // Log attempt
        await supabase.from("two_factor_attempts").insert({
          user_id: user.id,
          attempt_type: "totp",
          is_successful: isValid,
          ip_address: req.headers.get("x-forwarded-for") || "unknown"
        });

        if (!isValid) {
          throw new Error("Invalid verification code. Please try again.");
        }

        // Enable 2FA
        const { error: updateError } = await supabase
          .from("user_two_factor_auth")
          .update({
            is_enabled: true,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "2FA enabled successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify": {
        // Check rate limiting
        const { data: attempts } = await supabase.rpc("count_recent_2fa_attempts", {
          _user_id: user.id,
          _minutes: 15
        });
        
        if (attempts && attempts >= 10) {
          throw new Error("Too many failed attempts. Please try again later.");
        }

        // Get 2FA settings
        const { data: settings, error: settingsError } = await supabase
          .from("user_two_factor_auth")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError || !settings || !settings.is_enabled) {
          throw new Error("2FA is not enabled for this account.");
        }

        let isValid = false;
        let attemptType = "totp";

        if (backupCode) {
          // Verify backup code
          attemptType = "backup_code";
          const storedCodes: string[] = JSON.parse(
            await decryptData(settings.backup_codes_encrypted, encryptionKey)
          );
          
          const codeIndex = storedCodes.indexOf(backupCode.toUpperCase());
          if (codeIndex !== -1) {
            isValid = true;
            // Remove used backup code
            storedCodes.splice(codeIndex, 1);
            const newEncryptedCodes = await encryptData(JSON.stringify(storedCodes), encryptionKey);
            
            await supabase
              .from("user_two_factor_auth")
              .update({
                backup_codes_encrypted: newEncryptedCodes,
                last_used_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq("user_id", user.id);
          }
        } else if (code) {
          // Verify TOTP
          const secret = await decryptData(settings.secret_encrypted, encryptionKey);
          isValid = await verifyTOTP(secret, code);
          
          if (isValid) {
            await supabase
              .from("user_two_factor_auth")
              .update({
                last_used_at: new Date().toISOString()
              })
              .eq("user_id", user.id);
          }
        }

        // Log attempt
        await supabase.from("two_factor_attempts").insert({
          user_id: user.id,
          attempt_type: attemptType,
          is_successful: isValid,
          ip_address: req.headers.get("x-forwarded-for") || "unknown"
        });

        if (!isValid) {
          throw new Error("Invalid code. Please try again.");
        }

        return new Response(
          JSON.stringify({ success: true, verified: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disable": {
        // Verify current code before disabling
        const { data: settings, error: settingsError } = await supabase
          .from("user_two_factor_auth")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError || !settings || !settings.is_enabled) {
          throw new Error("2FA is not enabled.");
        }

        const secret = await decryptData(settings.secret_encrypted, encryptionKey);
        const isValid = await verifyTOTP(secret, code);

        // Log attempt
        await supabase.from("two_factor_attempts").insert({
          user_id: user.id,
          attempt_type: "totp",
          is_successful: isValid,
          ip_address: req.headers.get("x-forwarded-for") || "unknown"
        });

        if (!isValid) {
          throw new Error("Invalid verification code.");
        }

        // Disable 2FA
        const { error: deleteError } = await supabase
          .from("user_two_factor_auth")
          .delete()
          .eq("user_id", user.id);

        if (deleteError) {
          throw deleteError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "2FA disabled successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        const { data: settings } = await supabase
          .from("user_two_factor_auth")
          .select("is_enabled, verified_at, last_used_at")
          .eq("user_id", user.id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            enabled: settings?.is_enabled || false,
            verifiedAt: settings?.verified_at,
            lastUsedAt: settings?.last_used_at
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "regenerate-backup-codes": {
        // Get current settings
        const { data: settings, error: settingsError } = await supabase
          .from("user_two_factor_auth")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError || !settings || !settings.is_enabled) {
          throw new Error("2FA is not enabled.");
        }

        // Verify current code
        const secret = await decryptData(settings.secret_encrypted, encryptionKey);
        const isValid = await verifyTOTP(secret, code);

        if (!isValid) {
          throw new Error("Invalid verification code.");
        }

        // Generate new backup codes
        const newBackupCodes = generateBackupCodes();
        const encryptedBackupCodes = await encryptData(JSON.stringify(newBackupCodes), encryptionKey);

        const { error: updateError } = await supabase
          .from("user_two_factor_auth")
          .update({
            backup_codes_encrypted: encryptedBackupCodes,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            backupCodes: newBackupCodes
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error: any) {
    console.error("2FA Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
