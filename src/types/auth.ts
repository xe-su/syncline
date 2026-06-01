export interface AuthToken {
  access_token: string
  refresh_token: string
  expires_at: number
  tenant_id: string
  client_id: string
}

export interface TokenManagerConfig {
  refreshEndpoint: string
  refreshBuffer?: number
  offlineFallback?: boolean
}
