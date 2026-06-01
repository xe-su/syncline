import type { DBWrapper } from '../db/wrapper'

const META_TABLE = '_syncline_meta'

export class SequenceTracker {
  constructor(private db: DBWrapper) {}

  async ensureTables(): Promise<void> {
    await this.db.rawRun(`
      CREATE TABLE IF NOT EXISTS ${META_TABLE} (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `)
  }

  async getLastSeq(): Promise<number> {
    const rows = await this.db.rawQuery<{ value: string }>(`SELECT value FROM ${META_TABLE} WHERE key = 'last_seq'`)
    return rows[0] ? parseInt(rows[0].value, 10) : 0
  }

  async setLastSeq(seq: number): Promise<void> {
    await this.db.rawRun(
      `INSERT INTO ${META_TABLE} (key, value) VALUES ('last_seq', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [String(seq)]
    )
  }

  async getClientId(): Promise<string> {
    const rows = await this.db.rawQuery<{ value: string }>(`SELECT value FROM ${META_TABLE} WHERE key = 'client_id'`)
    if (rows[0]) return rows[0].value
    const id = crypto.randomUUID()
    await this.db.rawRun(`INSERT INTO ${META_TABLE} (key, value) VALUES ('client_id', ?)`, [id])
    return id
  }
}
