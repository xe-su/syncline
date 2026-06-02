import type { EncryptionConfig } from '../types/encryption'
import type { BaseAdapter } from '../adapters/base'
import { KeyStore } from './key-store'
import { CipherBridge } from './cipher-bridge'

export class EncryptionManager {
  private keyStore = new KeyStore()
  private cipherBridge = new CipherBridge()

  constructor(private config: EncryptionConfig) {}

  async deriveKey(passphrase: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt as BufferSource, iterations: this.config.kdfIterations ?? 256000, hash: 'SHA-256' },
      keyMaterial, 256
    )
    return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async applyToAdapter(adapter: BaseAdapter, dbName: string): Promise<void> {
    if (!this.config.enabled) return
    let key = await this.keyStore.retrieve(dbName)
    if (!key && this.config.passphrase) {
      const salt = crypto.getRandomValues(new Uint8Array(16))
      key = await this.deriveKey(this.config.passphrase, salt)
      await this.keyStore.store(dbName, key)
    }
    if (key) await this.cipherBridge.applyKey(adapter, dbName, key)
  }

  async storeKey(dbName: string, key: string): Promise<void> { await this.keyStore.store(dbName, key) }
  async retrieveKey(dbName: string): Promise<string | null> { return this.keyStore.retrieve(dbName) }
}
