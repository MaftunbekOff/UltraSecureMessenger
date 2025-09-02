
export class E2EEncryption {
  private static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
    const encoded = new TextEncoder().encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      encoded
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  static async decryptMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string> {
    const encrypted = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }
}
