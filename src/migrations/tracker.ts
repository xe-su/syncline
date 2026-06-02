import type { DBWrapper } from '../db/wrapper'
import type { AppliedMigration } from '../types/migration'

const TABLE = '_syncline_migrations'

export class MigrationTracker {
  constructor(private db: DBWrapper) {}

  async ensureTable(): Promise<void> {
    await this.db.rawRun(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        version     INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at  TEXT NOT NULL,
        duration_ms INTEGER NOT NULL
      )
    `)
  }

  async getApplied(): Promise<AppliedMigration[]> {
    const rows = await this.db.rawQuery<Record<string, unknown>>(`SELECT * FROM ${TABLE} ORDER BY version ASC`)
    return rows as unknown as AppliedMigration[]
  }

  async getCurrentVersion(): Promise<number> {
    const rows = await this.db.rawQuery<{ version: number }>(`SELECT MAX(version) as version FROM ${TABLE}`)
    return rows[0]?.version ?? 0
  }

  async markApplied(version: number, description: string, duration_ms: number): Promise<void> {
    await this.db.rawRun(
      `INSERT INTO ${TABLE} (version, description, applied_at, duration_ms) VALUES (?, ?, ?, ?)`,
      [version, description, new Date().toISOString(), duration_ms]
    )
  }

  async markRolledBack(version: number): Promise<void> {
    await this.db.rawRun(`DELETE FROM ${TABLE} WHERE version = ?`, [version])
  }
}
