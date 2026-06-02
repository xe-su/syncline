import { detectPlatform } from '../utils/platform'

export class KeyStore {
  async store(dbName: string, key: string): Promise<void> {
    const platform = detectPlatform()
    if (platform === 'web') {
      localStorage.setItem(`syncline:key:${dbName}`, btoa(key))
    } else if (platform === 'capacitor') {
      // @ts-ignore — optional peer dep
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: `syncline:key:${dbName}`, value: key })
    } else {
      try {
        // @ts-ignore — optional peer dep
        const keytar = await import('keytar')
        await keytar.setPassword('syncline', dbName, key)
      } catch {
        const fs = await import('fs/promises')
        await fs.writeFile(`.syncline-key-${dbName}`, key, 'utf8')
      }
    }
  }

  async retrieve(dbName: string): Promise<string | null> {
    const platform = detectPlatform()
    if (platform === 'web') {
      const val = localStorage.getItem(`syncline:key:${dbName}`)
      return val ? atob(val) : null
    } else if (platform === 'capacitor') {
      // @ts-ignore — optional peer dep
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key: `syncline:key:${dbName}` })
      return value
    } else {
      try {
        // @ts-ignore — optional peer dep
        const keytar = await import('keytar')
        return keytar.getPassword('syncline', dbName)
      } catch {
        const fs = await import('fs/promises')
        return fs.readFile(`.syncline-key-${dbName}`, 'utf8').catch(() => null)
      }
    }
  }

  async clear(dbName: string): Promise<void> {
    const platform = detectPlatform()
    if (platform === 'web') {
      localStorage.removeItem(`syncline:key:${dbName}`)
    } else if (platform === 'capacitor') {
      // @ts-ignore — optional peer dep
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key: `syncline:key:${dbName}` })
    } else {
      try {
        // @ts-ignore — optional peer dep
        const keytar = await import('keytar')
        await keytar.deletePassword('syncline', dbName)
      } catch {}
    }
  }
}
