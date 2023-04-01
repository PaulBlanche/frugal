const KEY_FORMAT = 'jwk';
const KEY_ALGORITHM: HmacKeyGenParams = { name: 'HMAC', hash: 'SHA-512' };
const KEY_EXTRACTABLE = true;
const KEY_USAGE: KeyUsage[] = ['sign', 'verify'];

export async function importKey(key: string): Promise<CryptoKey> {
  const importkey = JSON.parse(atob(key));

  return await crypto.subtle.importKey(
    KEY_FORMAT,
    importkey,
    KEY_ALGORITHM,
    KEY_EXTRACTABLE,
    KEY_USAGE,
  );
}

export async function exportKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    KEY_ALGORITHM,
    KEY_EXTRACTABLE,
    KEY_USAGE,
  );

  const exportKey = await crypto.subtle.exportKey(KEY_FORMAT, key);
  return btoa(JSON.stringify(exportKey));
}
