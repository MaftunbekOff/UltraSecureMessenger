
// Bridge to WebAssembly crypto module
export class WasmCrypto {
  private static wasmModule: any = null;

  static async initialize() {
    if (!this.wasmModule) {
      // Load WebAssembly module for encryption
      this.wasmModule = await import('./crypto.wasm');
    }
  }

  static async encryptMessageWasm(message: string, key: string): Promise<string> {
    await this.initialize();
    return this.wasmModule.encrypt(message, key);
  }

  static async decryptMessageWasm(encrypted: string, key: string): Promise<string> {
    await this.initialize();
    return this.wasmModule.decrypt(encrypted, key);
  }
}
