import { BaseAdapter } from '../base'
import type { AdapterConfig, Row, RunResult, Transaction } from '../../types/adapter'

export class CapacitorAdapter extends BaseAdapter {
  private plugin: unknown = null
  private dbName: string = ''

  async open(name: string, config?: AdapterConfig): Promise<void> {
    this.dbName = name
    // @ts-ignore — optional peer dep
    const { CapacitorSQLite } = await import('@capacitor-community/sqlite')
    this.plugin = CapacitorSQLite
    const p = this.plugin as {
      createConnection(opts: object): Promise<void>
      open(opts: object): Promise<void>
    }
    await p.createConnection({ database: name, encrypted: !!config?.encryptionKey, mode: 'secret', version: 1 })
    await p.open({ database: name })
    this._isOpen = true
  }

  async close(): Promise<void> {
    const p = this.plugin as { closeConnection(opts: object): Promise<void> }
    await p.closeConnection({ database: this.dbName })
    this._isOpen = false
  }

  async query<T extends Row>(sql: string, params?: unknown[]): Promise<T[]> {
    const p = this.plugin as { query(opts: object): Promise<{ values: T[] }> }
    const result = await p.query({ database: this.dbName, statement: sql, values: params ?? [] })
    return result.values ?? []
  }

  async run(sql: string, params?: unknown[]): Promise<RunResult> {
    const p = this.plugin as { run(opts: object): Promise<{ changes: { lastId: number; changes: number } }> }
    const result = await p.run({ database: this.dbName, statement: sql, values: params ?? [] })
    return { lastInsertRowid: result.changes.lastId, changes: result.changes.changes }
  }

  async transaction(fn: (tx: Transaction) => Promise<void>): Promise<void> {
    const p = this.plugin as {
      beginTransaction(opts: object): Promise<void>
      commitTransaction(opts: object): Promise<void>
      rollbackTransaction(opts: object): Promise<void>
    }
    await p.beginTransaction({ database: this.dbName })
    try {
      const tx: Transaction = {
        query: <T extends Row>(_sql: string, _params?: unknown[]): T[] => {
          throw new Error('Use async query in Capacitor transactions')
        },
        run: (_sql: string, _params?: unknown[]): RunResult => {
          throw new Error('Use async run in Capacitor transactions')
        }
      }
      await fn(tx)
      await p.commitTransaction({ database: this.dbName })
    } catch (e) {
      await p.rollbackTransaction({ database: this.dbName })
      throw e
    }
  }
}
