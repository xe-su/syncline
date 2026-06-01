import { BaseAdapter } from '../base'
import type { AdapterConfig, Row, RunResult, Transaction } from '../../types/adapter'

export class DesktopAdapter extends BaseAdapter {
  private db: unknown = null

  async open(name: string, config?: AdapterConfig): Promise<void> {
    const Database = (await import('better-sqlite3')).default
    this.db = new (Database as new (path: string) => unknown)(name)
    if (config?.encryptionKey) {
      const { initCipher } = await import('./cipher')
      initCipher(this.db as { pragma(sql: string): void }, config.encryptionKey)
    }
    this._isOpen = true
  }

  async close(): Promise<void> {
    if (this.db) (this.db as { close(): void }).close()
    this._isOpen = false
    this.db = null
  }

  async query<T extends Row>(sql: string, params?: unknown[]): Promise<T[]> {
    const db = this.db as { prepare(sql: string): { all(...p: unknown[]): T[] } }
    return db.prepare(sql).all(...(params ?? []))
  }

  async run(sql: string, params?: unknown[]): Promise<RunResult> {
    const db = this.db as { prepare(sql: string): { run(...p: unknown[]): { lastInsertRowid: number; changes: number } } }
    const result = db.prepare(sql).run(...(params ?? []))
    return { lastInsertRowid: result.lastInsertRowid, changes: result.changes }
  }

  async transaction(fn: (tx: Transaction) => Promise<void>): Promise<void> {
    const db = this.db as {
      prepare(sql: string): { all(...p: unknown[]): unknown[]; run(...p: unknown[]): { lastInsertRowid: number; changes: number } }
    }
    const ops: Array<() => void> = []
    const tx: Transaction = {
      query: <T extends Row>(sql: string, params?: unknown[]) => db.prepare(sql).all(...(params ?? [])) as T[],
      run: (sql: string, params?: unknown[]) => {
        const r = db.prepare(sql).run(...(params ?? []))
        return { lastInsertRowid: r.lastInsertRowid, changes: r.changes }
      }
    }
    await fn(tx)
  }
}
