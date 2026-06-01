import type { Row } from './adapter'

export interface ChangeRecord {
  id: string
  table: string
  row_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: Row | null
  seq: number
  timestamp: number
  client_id: string
  tenant_id: string
}

export interface SyncState {
  lastSeq: number
  clientId: string
  tenantId: string
  connected: boolean
  syncing: boolean
}

export type SyncMessage =
  | { type: 'HELLO'; client_id: string; tenant_id: string; last_seq: number }
  | { type: 'READY'; server_seq: number }
  | { type: 'CHANGE'; change: ChangeRecord }
  | { type: 'CHANGES'; changes: ChangeRecord[]; has_more: boolean }
  | { type: 'ACK'; seq?: number; id?: string }
  | { type: 'PING' }
  | { type: 'PONG' }
  | { type: 'ERROR'; code: string; message: string; fatal?: boolean }

export type SyncEvent = 'connected' | 'disconnected' | 'change' | 'synced' | 'error' | 'reconnecting'
