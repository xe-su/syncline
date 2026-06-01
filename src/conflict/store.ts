import type { DBWrapper } from '../db/wrapper'
import type { ConflictRecord } from '../types/conflict'

const TABLE = '_syncline_conflicts'

export class ConflictStore {
  constructor(private db: DBWrapper) {}

  async ensureTable(): Promise<void> {
    await this.db.rawRun(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        id              TEXT PRIMARY KEY,
        table_name      TEXT NOT NULL,
        row_id          TEXT NOT NULL,
        local_version   TEXT NOT NULL,
        remote_version  TEXT NOT NULL,
        detected_at     TEXT NOT NULL,
        resolved        INTEGER DEFAULT 0,
        resolution      TEXT,
        resolved_at     TEXT
      )
    `)
  }

  async save(conflict: ConflictRecord): Promise<void> {
    await this.db.rawRun(
      `INSERT INTO ${TABLE} (id, table_name, row_id, local_version, remote_version, detected_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [conflict.id, conflict.table, conflict.row_id, JSON.stringify(conflict.local_version), JSON.stringify(conflict.remote_version), conflict.detected_at]
    )
  }

  async getUnresolved(): Promise<ConflictRecord[]> {
    const rows = await this.db.rawQuery<{ id: string; table_name: string; row_id: string; local_version: string; remote_version: string; detected_at: string }>(
      `SELECT * FROM ${TABLE} WHERE resolved = 0 ORDER BY detected_at DESC`
    )
    return rows.map(r => ({
      id: r.id, table: r.table_name, row_id: r.row_id,
      local_version: JSON.parse(r.local_version), remote_version: JSON.parse(r.remote_version),
      detected_at: r.detected_at, resolved: false
    }))
  }

  async resolve(id: string, resolution: 'local' | 'remote' | 'merged'): Promise<void> {
    await this.db.rawRun(`UPDATE ${TABLE} SET resolved = 1, resolution = ?, resolved_at = ? WHERE id = ?`, [resolution, new Date().toISOString(), id])
  }
}
