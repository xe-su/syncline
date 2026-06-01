import type { BaseAdapter } from '../adapters/base'
import { detectPlatform } from '../utils/platform'

export class CipherBridge {
  async applyKey(adapter: BaseAdapter, dbName: string, key: string): Promise<void> {
    const platform = detectPlatform()
    if (platform === 'desktop') {
      const { initCipher } = await import('../adapters/desktop/cipher')
      initCipher(adapter as never, key)
    } else if (platform === 'capacitor') {
      // Applied during open() in CapacitorAdapter
    } else {
      console.warn('[SyncLine] SQLCipher on web not yet supported — DB will be unencrypted')
    }
  }
}
