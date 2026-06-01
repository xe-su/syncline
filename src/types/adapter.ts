export type Unsubscribe = () => void

export interface AdapterConfig {
  encryptionKey?: string
  readonly?: boolean
}

export interface RunResult {
  lastInsertRowid: number | bigint
  changes: number
}

export type Row = Record<string, unknown>
export type WhereClause = Record<string, unknown>

export interface Transaction {
  query<T extends Row>(sql: string, params?: unknown[]): T[]
  run(sql: string, params?: unknown[]): RunResult
}

export type ChangeListener = (table: string, rowId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE') => void

export interface DBAdapter {
  open(name: string, config?: AdapterConfig): Promise<void>
  close(): Promise<void>
  query<T extends Row>(sql: string, params?: unknown[]): Promise<T[]>
  run(sql: string, params?: unknown[]): Promise<RunResult>
  transaction(fn: (tx: Transaction) => Promise<void>): Promise<void>
  onChange(listener: ChangeListener): Unsubscribe
  isOpen(): boolean
}
