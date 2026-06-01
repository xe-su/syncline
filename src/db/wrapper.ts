import type { DBAdapter, Row, RunResult, WhereClause } from '../types/adapter'
import type { TableSchema } from './schema-registry'
import { SchemaRegistry } from './schema-registry'
import { buildInsert, buildUpdate, buildDelete, buildWhereClause } from './executor'

export class DBWrapper {
  private adapter: DBAdapter
  readonly schemas: SchemaRegistry

  constructor(adapter: DBAdapter) {
    this.adapter = adapter
    this.schemas = new SchemaRegistry()
  }

  registerTable(schema: TableSchema): void {
    this.schemas.register(schema)
  }

  async query<T extends Row>(table: string, where?: WhereClause): Promise<T[]> {
    const { sql: whereSQL, params } = where ? buildWhereClause(where) : { sql: '', params: [] }
    return this.adapter.query<T>(`SELECT * FROM "${table}"${whereSQL ? ' ' + whereSQL : ''}`, params)
  }

  async insert(table: string, data: Row): Promise<RunResult> {
    const { sql, params } = buildInsert(table, data)
    return this.adapter.run(sql, params)
  }

  async update(table: string, data: Partial<Row>, where: WhereClause): Promise<RunResult> {
    const { sql, params } = buildUpdate(table, data, where)
    return this.adapter.run(sql, params)
  }

  async delete(table: string, where: WhereClause): Promise<RunResult> {
    const { sql, params } = buildDelete(table, where)
    return this.adapter.run(sql, params)
  }

  async rawQuery<T extends Row>(sql: string, params?: unknown[]): Promise<T[]> {
    return this.adapter.query<T>(sql, params)
  }

  async rawRun(sql: string, params?: unknown[]): Promise<RunResult> {
    return this.adapter.run(sql, params)
  }

  async transaction(fn: (db: DBWrapper) => Promise<void>): Promise<void> {
    return this.adapter.transaction(async () => {
      await fn(this)
    })
  }

  getAdapter(): DBAdapter { return this.adapter }
}
