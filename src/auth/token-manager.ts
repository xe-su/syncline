import { EventEmitter } from '../utils/event-emitter'
import { TokenStore } from './token-store'
import { RefreshScheduler } from './refresh-scheduler'
import type { AuthToken, TokenManagerConfig } from '../types/auth'

interface TokenManagerEvents {
  refreshed: AuthToken
  expired: void
  'refresh-failed': Error
  [key: string]: unknown
}

export class TokenManager extends EventEmitter<TokenManagerEvents> {
  private store = new TokenStore()
  private scheduler = new RefreshScheduler()
  private refreshing: Promise<AuthToken> | null = null
  private config: Required<TokenManagerConfig>

  constructor(config: TokenManagerConfig) {
    super()
    this.config = { refreshEndpoint: config.refreshEndpoint, refreshBuffer: config.refreshBuffer ?? 60000, offlineFallback: config.offlineFallback ?? true }
  }

  async setToken(token: AuthToken): Promise<void> {
    await this.store.save(token)
    this.scheduler.schedule(token.expires_at, this.config.refreshBuffer, () => this.refresh())
  }

  async getToken(): Promise<AuthToken | null> { return this.store.load() }

  async getValidToken(): Promise<AuthToken> {
    const token = await this.store.load()
    if (!token) throw new Error('No auth token stored')
    if (this.isTokenValid(token)) return token
    try { return await this.refresh() } catch {
      if (this.config.offlineFallback) return token
      throw new Error('Token expired and offline fallback is disabled')
    }
  }

  isTokenValid(token: AuthToken): boolean { return Date.now() < token.expires_at - this.config.refreshBuffer }

  async clearToken(): Promise<void> { this.scheduler.cancel(); await this.store.clear() }

  private async refresh(): Promise<AuthToken> {
    if (this.refreshing) return this.refreshing
    this.refreshing = (async () => {
      const current = await this.store.load()
      if (!current) throw new Error('No token to refresh')
      const resp = await fetch(this.config.refreshEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: current.refresh_token })
      })
      if (!resp.ok) throw new Error(`Token refresh failed: ${resp.status}`)
      const data = await resp.json() as { access_token: string; expires_at: number }
      const newToken: AuthToken = { ...current, access_token: data.access_token, expires_at: data.expires_at }
      await this.setToken(newToken)
      this.emit('refreshed', newToken)
      return newToken
    })()
    try { return await this.refreshing } finally { this.refreshing = null }
  }
}
