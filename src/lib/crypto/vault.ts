// Simple WebCrypto vault for client-side mnemonic encryption
// Non-custodial: stores encrypted payload in localStorage only

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin);
}

function fromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(passkey: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passkey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 150_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface VaultPayload {
  mnemonic: string;
  createdAt: string;
}

export interface VaultRecord {
  salt: string; // base64
  iv: string;   // base64
  data: string; // base64
}

const vaultKey = (chain: string) => `usdtbanc:vault:${chain}`;

export async function saveToVault(chain: string, passkey: string, payload: VaultPayload) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passkey, salt);
  const plaintext = textEncoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const record: VaultRecord = {
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer),
    data: toBase64(ciphertext),
  };
  localStorage.setItem(vaultKey(chain), JSON.stringify(record));
}

export async function loadFromVault(chain: string, passkey: string): Promise<VaultPayload | null> {
  const raw = localStorage.getItem(vaultKey(chain));
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as VaultRecord;
    const salt = new Uint8Array(fromBase64(rec.salt));
    const iv = new Uint8Array(fromBase64(rec.iv));
    const key = await deriveKey(passkey, salt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromBase64(rec.data));
    const json = JSON.parse(textDecoder.decode(decrypted)) as VaultPayload;
    return json;
  } catch {
    return null;
  }
}

export function hasVault(chain: string) {
  return !!localStorage.getItem(vaultKey(chain));
}

export function clearVault(chain: string) {
  localStorage.removeItem(vaultKey(chain));
}
