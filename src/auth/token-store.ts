import type { AuthToken } from '../types/auth'

const STORAGE_KEY = 'syncline:auth:token'

export class TokenStore {
  async save(token: AuthToken): Promise<void> {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(token))
  }

  async load(): Promise<AuthToken | null> {
    if (typeof localStorage === 'undefined') return null
    const val = localStorage.getItem(STORAGE_KEY)
    if (!val) return null
    try { return JSON.parse(val) as AuthToken } catch { return null }
  }

  async clear(): Promise<void> {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  }
}
