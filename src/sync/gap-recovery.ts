import type { ChangeRecord } from '../types/sync'

export interface GapRecoveryOptions {
  endpoint: string
  tenantId: string
  pageSize?: number
  getToken: () => Promise<string>
}

export async function* fetchMissedChanges(sinceSeq: number, options: GapRecoveryOptions): AsyncGenerator<ChangeRecord[]> {
  const { endpoint, tenantId, pageSize = 500, getToken } = options
  let cursor = sinceSeq
  let hasMore = true

  while (hasMore) {
    const token = await getToken()
    const resp = await fetch(`${endpoint}/sync/changes?since_seq=${cursor}&limit=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Id': tenantId }
    })
    if (!resp.ok) throw new Error(`Gap recovery failed: ${resp.status}`)
    const data = await resp.json() as { changes: ChangeRecord[]; has_more: boolean; next_seq: number }
    if (data.changes.length > 0) yield data.changes
    hasMore = data.has_more
    cursor = data.next_seq
  }
}
