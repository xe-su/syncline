import type { DBWrapper } from '../db/wrapper'
import type { ChangeRecord } from '../types/sync'

const TABLE = '_syncline_queue'

export interface QueuedChange {
  queue_id: number
  change: ChangeRecord
  attempts: number
  created_at: string
  last_attempt?: string
}

export class QueueStore {
  constructor(private db: DBWrapper) {}

  async ensureTable(): Promise<void> {
    await this.db.rawRun(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        queue_id     INTEGER PRIMARY KEY AUTOINCREMENT,
        change_json  TEXT NOT NULL,
        attempts     INTEGER DEFAULT 0,
        created_at   TEXT NOT NULL,
        last_attempt TEXT
      )
    `)
  }

  async enqueue(change: ChangeRecord): Promise<void> {
    await this.db.rawRun(`INSERT INTO ${TABLE} (change_json, created_at) VALUES (?, ?)`, [JSON.stringify(change), new Date().toISOString()])
  }

  async getAll(): Promise<QueuedChange[]> {
    const rows = await this.db.rawQuery<{ queue_id: number; change_json: string; attempts: number; created_at: string; last_attempt?: string }>(
      `SELECT * FROM ${TABLE} ORDER BY queue_id ASC`
    )
    return rows.map(r => ({ ...r, change: JSON.parse(r.change_json) as ChangeRecord }))
  }

  async getDepth(): Promise<number> {
    const rows = await this.db.rawQuery<{ count: number }>(`SELECT COUNT(*) as count FROM ${TABLE}`)
    return rows[0]?.count ?? 0
  }

  async remove(queueId: number): Promise<void> {
    await this.db.rawRun(`DELETE FROM ${TABLE} WHERE queue_id = ?`, [queueId])
  }

  async incrementAttempts(queueId: number): Promise<void> {
    await this.db.rawRun(`UPDATE ${TABLE} SET attempts = attempts + 1, last_attempt = ? WHERE queue_id = ?`, [new Date().toISOString(), queueId])
  }

  async clear(): Promise<void> {
    await this.db.rawRun(`DELETE FROM ${TABLE}`)
  }
}
