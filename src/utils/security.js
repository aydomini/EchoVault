// Security utilities for EchoVault
// Implements: Nonce mechanism, ECDSA signatures, ECDH key exchange

export class SecurityHelper {
  // ========================
  // Nonce for Replay Attack Prevention
  // ========================

  static generateNonce() {
    const timestamp = Date.now();
    const randomPart = crypto.getRandomValues(new Uint8Array(16));
    return {
      timestamp,
      random: Array.from(randomPart),
      value: `${timestamp}-${Array.from(randomPart).map(b => b.toString(16).padStart(2, '0')).join('')}`
    };
  }

  static verifyNonce(nonce, usedNonces) {
    const now = Date.now();
    const NONCE_WINDOW = 5000; // 5 seconds

    // Check timestamp is within window
    if (Math.abs(now - nonce.timestamp) > NONCE_WINDOW) {
      console.warn('⚠️ Nonce timestamp outside window:', nonce.timestamp, 'now:', now);
      return false;
    }

    // Check nonce hasn't been used
    if (usedNonces.has(nonce.value)) {
      console.warn('⚠️ Nonce already used:', nonce.value);
      return false;
    }

    return true;
  }

  static cleanupOldNonces(usedNonces) {
    const now = Date.now();
    const CLEANUP_AGE = 10000; // Remove nonces older than 10 seconds

    for (const [value, timestamp] of usedNonces.entries()) {
      if (now - timestamp > CLEANUP_AGE) {
        usedNonces.delete(value);
      }
    }
  }

  // ========================
  // ECDSA Message Signing
  // ========================

  static async generateSigningKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );

    return keyPair;
  }

  static async signMessage(message, privateKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      privateKey,
      data
    );

    return Array.from(new Uint8Array(signature));
  }

  static async verifySignature(message, signature, publicKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      publicKey,
      new Uint8Array(signature),
      data
    );

    return isValid;
  }

  static async exportPublicKey(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return Array.from(new Uint8Array(exported));
  }

  static async importPublicKey(keyData) {
    return await crypto.subtle.importKey(
      'spki',
      new Uint8Array(keyData),
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['verify']
    );
  }

  static async exportPrivateKey(privateKey) {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return Array.from(new Uint8Array(exported));
  }

  static async importPrivateKey(keyData) {
    return await crypto.subtle.importKey(
      'pkcs8',
      new Uint8Array(keyData),
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign']
    );
  }

  // ========================
  // ECDH Key Agreement
  // ========================

  static async generateECDHKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    return keyPair;
  }

  static async deriveSharedSecret(privateKey, publicKey) {
    const sharedSecret = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: publicKey
      },
      privateKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );

    return sharedSecret;
  }

  static async exportECDHPublicKey(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return Array.from(new Uint8Array(exported));
  }

  static async importECDHPublicKey(keyData) {
    return await crypto.subtle.importKey(
      'spki',
      new Uint8Array(keyData),
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      []
    );
  }

  static async exportECDHPrivateKey(privateKey) {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return Array.from(new Uint8Array(exported));
  }

  static async importECDHPrivateKey(keyData) {
    return await crypto.subtle.importKey(
      'pkcs8',
      new Uint8Array(keyData),
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey', 'deriveBits']
    );
  }

  // ========================
  // ECDH Key Exchange Manager
  // ========================

  static async performKeyExchange(myECDHKeyPair, peerPublicKeyData) {
    // Import peer's public key
    const peerPublicKey = await this.importECDHPublicKey(peerPublicKeyData);

    // Derive shared secret
    const sharedSecret = await this.deriveSharedSecret(myECDHKeyPair.privateKey, peerPublicKey);

    return sharedSecret;
  }

  static async encryptWithSharedKey(data, sharedKey) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      encoder.encode(JSON.stringify(data))
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  static async decryptWithSharedKey(encryptedObj, sharedKey) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedObj.iv) },
      sharedKey,
      new Uint8Array(encryptedObj.data)
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  // ========================
  // Key Fingerprinting
  // ========================

  static async generateFingerprint(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    const hash = await crypto.subtle.digest('SHA-256', exported);
    const hashArray = Array.from(new Uint8Array(hash));

    // Format as readable fingerprint (e.g., "A1B2 C3D4 E5F6...")
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hex.match(/.{1,4}/g).join(' ').toUpperCase();
  }

  // ========================
  // Session Token
  // ========================

  static async generateSessionToken() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      value: token,
      created: Date.now()
    };
  }

  static verifySessionToken(token, maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    if (!token || !token.created) return false;

    const age = now - token.created;
    return age <= maxAge;
  }

  // ========================
  // Password Sharing via URL Fragment (not sent to server)
  // ========================

  static createSecureShareLink(roomId, password) {
    const data = { roomId, password };
    const json = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(json)));

    // Use URL fragment (#) - this is NOT sent to server
    return `${window.location.origin}/#join=${base64}`;
  }

  static parseSecureShareLink(url) {
    try {
      // Extract fragment (after #)
      const hash = new URL(url).hash;
      if (!hash.startsWith('#join=')) return null;

      const base64 = hash.substring(6); // Remove '#join='
      const json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json);
    } catch (err) {
      console.error('Failed to parse share link:', err);
      return null;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SecurityHelper };
}
