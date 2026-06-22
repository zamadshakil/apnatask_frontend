// src/utils/jwt.ts
import CryptoJS from 'crypto-js';

// Base64url encoding helper
function base64url(source: CryptoJS.lib.WordArray): string {
  let encoded = CryptoJS.enc.Base64.stringify(source);
  encoded = encoded.replace(/=+$/, '');
  encoded = encoded.replace(/\+/g, '-');
  encoded = encoded.replace(/\//g, '_');
  return encoded;
}

export function generateMockJWT(userId: number, role: 'customer' | 'provider'): string {
  // Must match settings.JWT_SECRET_KEY in fastapi backend config
  const secret = 'super-secret-key-change-in-production';
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    user_id: userId,
    role: role
  };
  
  const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
  const stringifiedPayload = CryptoJS.enc.Utf8.parse(JSON.stringify(payload));
  
  const base64Header = base64url(stringifiedHeader);
  const base64Payload = base64url(stringifiedPayload);
  
  const signatureInput = `${base64Header}.${base64Payload}`;
  const signature = CryptoJS.HmacSHA256(signatureInput, secret);
  const base64Signature = base64url(signature);
  
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}
