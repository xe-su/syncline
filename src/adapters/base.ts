import type { DBAdapter, AdapterConfig, Row, RunResult, Transaction, ChangeListener, Unsubscribe } from '../types/adapter'

export abstract class BaseAdapter implements DBAdapter {
  protected _isOpen = false
  protected _changeListeners = new Set<ChangeListener>()

  abstract open(name: string, config?: AdapterConfig): Promise<void>
  abstract close(): Promise<void>
  abstract query<T extends Row>(sql: string, params?: unknown[]): Promise<T[]>
  abstract run(sql: string, params?: unknown[]): Promise<RunResult>
  abstract transaction(fn: (tx: Transaction) => Promise<void>): Promise<void>

  isOpen(): boolean { return this._isOpen }

  onChange(listener: ChangeListener): Unsubscribe {
    this._changeListeners.add(listener)
    return () => this._changeListeners.delete(listener)
  }

  protected notifyChange(table: string, rowId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE'): void {
    for (const listener of this._changeListeners) {
      listener(table, rowId, operation)
    }
  }
}
