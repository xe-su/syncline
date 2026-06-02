import { BaseAdapter } from '../base'
import type { AdapterConfig, Row, RunResult, Transaction } from '../../types/adapter'
import { isOPFSSupported } from './opfs'

export class WebAdapter extends BaseAdapter {
  private worker: Worker | null = null
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  private msgId = 0

  async open(name: string, config?: AdapterConfig): Promise<void> {
    if (!isOPFSSupported()) {
      console.warn('[SyncLine] OPFS not supported — falling back to in-memory SQLite')
    }

    this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
    this.worker.onmessage = (event: MessageEvent<{ id: string; result?: unknown; error?: string }>) => {
      const { id, result, error } = event.data
      const pending = this.pending.get(id)
      if (!pending) return
      this.pending.delete(id)
      if (error) pending.reject(new Error(error))
      else pending.resolve(result)
    }
    this.worker.onerror = (e) => {
      console.error('[SyncLine Worker] error:', e.message)
      for (const { reject } of this.pending.values()) reject(new Error(e.message ?? 'Worker error'))
      this.pending.clear()
    }

    await this.send('open', { dbName: name, encryptionKey: config?.encryptionKey })
    this._isOpen = true
  }

  async close(): Promise<void> {
    await this.send('close', {})
    this.worker?.terminate()
    this.worker = null
    this._isOpen = false
  }

  async query<T extends Row>(sql: string, params?: unknown[]): Promise<T[]> {
    return this.send('query', { sql, params }) as Promise<T[]>
  }

  async run(sql: string, params?: unknown[]): Promise<RunResult> {
    return this.send('run', { sql, params }) as Promise<RunResult>
  }

  async transaction(fn: (tx: Transaction) => Promise<void>): Promise<void> {
    await this.run('BEGIN')
    try {
      const ops: Array<{ sql: string; params?: unknown[] }> = []
      const tx: Transaction = {
        query: <T extends Row>(): T[] => {
          throw new Error('Use run() to collect ops in WebAdapter transactions')
        },
        run: (sql: string, params?: unknown[]): RunResult => {
          ops.push({ sql, params })
          return { lastInsertRowid: 0, changes: 0 }
        }
      }
      await fn(tx)
      for (const op of ops) {
        await this.run(op.sql, op.params)
      }
      await this.run('COMMIT')
    } catch (e) {
      await this.run('ROLLBACK')
      throw e
    }
  }

  private send(type: string, data: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = String(++this.msgId)
      this.pending.set(id, { resolve, reject })
      this.worker?.postMessage({ id, type, ...data })
    })
  }
}
