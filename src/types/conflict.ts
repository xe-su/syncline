import type { Row } from './adapter'

export interface ConflictMeta {
  table: string
  row_id: string
  local_timestamp: number
  remote_timestamp: number
  local_client_id: string
  remote_client_id: string
}

export interface ConflictRecord {
  id: string
  table: string
  row_id: string
  local_version: Row
  remote_version: Row
  detected_at: string
  resolved: boolean
  resolution?: 'local' | 'remote' | 'merged'
  resolved_at?: string
}

export type ConflictResolutionStrategy = 'last-write-wins' | 'first-write-wins' | 'manual'
export type ManualResolverFn = (local: Row, remote: Row, meta: ConflictMeta) => Promise<Row | 'local' | 'remote'>
