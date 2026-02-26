/**
 * E2E Encryption Module using Web Crypto API
 * ECDH P-256 for key exchange, AES-256-GCM for message encryption
 * Private keys NEVER leave the client (stored in IndexedDB)
 */

const DB_NAME = 'e2e_keys_store';
const STORE_NAME = 'private_keys';
const DB_VERSION = 1;

// ─── IndexedDB for Private Keys ───────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storePrivateKey(userId: string, privateKey: CryptoKey, deviceId: string): Promise<void> {
  const db = await openDB();
  const exported = await crypto.subtle.exportKey('jwk', privateKey);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ userId, deviceId, privateKey: exported });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(userId);
    req.onsuccess = async () => {
      if (!req.result) return resolve(null);
      try {
        const key = await crypto.subtle.importKey(
          'jwk',
          req.result.privateKey,
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          ['deriveBits']
        );
        resolve(key);
      } catch {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function hasLocalKeys(userId: string): Promise<boolean> {
  const key = await getPrivateKey(userId);
  return key !== null;
}

// ─── Key Generation ───────────────────────────────────────
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: CryptoKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // extractable for public key export
    ['deriveBits']
  );

  // Export public key as base64
  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));

  // Make private key non-extractable by re-importing
  const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, // non-extractable
    ['deriveBits']
  );

  return { publicKey: publicKeyBase64, privateKey };
}

export async function savePrivateKeyLocally(userId: string, privateKey: CryptoKey, deviceId: string): Promise<void> {
  // We need extractable key for storage, re-export temporarily
  // Since we made it non-extractable above, we store the JWK before that step
  await storePrivateKey(userId, privateKey, deviceId);
}

// For saving, we need the extractable version
export async function generateAndSaveKeyPair(userId: string, deviceId: string): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));

  await storePrivateKey(userId, keyPair.privateKey, deviceId);

  return publicKeyBase64;
}

// ─── Shared Secret Derivation ─────────────────────────────
async function deriveSharedKey(privateKey: CryptoKey, publicKeyBase64: string): Promise<CryptoKey> {
  // Import remote public key
  const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  const publicKey = await crypto.subtle.importKey(
    'raw',
    publicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared bits
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );

  // Import as AES-GCM key
  return crypto.subtle.importKey(
    'raw',
    sharedBits,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─── Encrypt / Decrypt ────────────────────────────────────
export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string;         // base64
}

export async function encryptMessage(
  userId: string,
  recipientPublicKey: string,
  plaintext: string
): Promise<EncryptedPayload> {
  const privateKey = await getPrivateKey(userId);
  if (!privateKey) throw new Error('E2E_NO_PRIVATE_KEY');

  const sharedKey = await deriveSharedKey(privateKey, recipientPublicKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptMessage(
  userId: string,
  senderPublicKey: string,
  payload: EncryptedPayload
): Promise<string> {
  const privateKey = await getPrivateKey(userId);
  if (!privateKey) throw new Error('E2E_NO_PRIVATE_KEY');

  const sharedKey = await deriveSharedKey(privateKey, senderPublicKey);
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const cipherBytes = Uint8Array.from(atob(payload.ciphertext), c => c.charCodeAt(0));

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    cipherBytes
  );

  return new TextDecoder().decode(plainBuffer);
}

// ─── Device ID ────────────────────────────────────────────
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('e2e_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('e2e_device_id', deviceId);
  }
  return deviceId;
}
