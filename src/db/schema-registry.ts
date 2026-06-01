export interface ColumnDef {
  name: string
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NUMERIC'
  primaryKey?: boolean
  nullable?: boolean
  default?: string
}

export interface TableSchema {
  name: string
  columns: ColumnDef[]
  syncable?: boolean
}

export class SchemaRegistry {
  private schemas = new Map<string, TableSchema>()

  register(schema: TableSchema): void {
    this.schemas.set(schema.name, schema)
  }

  get(name: string): TableSchema | undefined {
    return this.schemas.get(name)
  }

  getSyncable(): TableSchema[] {
    return [...this.schemas.values()].filter(s => s.syncable !== false)
  }

  has(name: string): boolean {
    return this.schemas.has(name)
  }
}
