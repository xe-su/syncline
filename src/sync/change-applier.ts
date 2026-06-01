import type { DBWrapper } from '../db/wrapper'
import type { ChangeRecord } from '../types/sync'

export class ChangeApplier {
  constructor(private db: DBWrapper) {}

  async apply(change: ChangeRecord): Promise<void> {
    const { table, row_id, operation, payload } = change

    if (operation === 'DELETE') {
      await this.db.rawRun(`UPDATE "${table}" SET _deleted = 1, updated_at = ? WHERE id = ?`, [new Date().toISOString(), row_id])
      return
    }

    if (!payload) return

    if (operation === 'INSERT') {
      const keys = Object.keys(payload)
      const cols = keys.map(k => `"${k}"`).join(', ')
      const placeholders = keys.map(() => '?').join(', ')
      await this.db.rawRun(`INSERT OR IGNORE INTO "${table}" (${cols}) VALUES (${placeholders})`, keys.map(k => payload[k]))
      return
    }

    if (operation === 'UPDATE') {
      const { id: _, ...fields } = payload
      const setClause = Object.keys(fields).map(k => `"${k}" = ?`).join(', ')
      await this.db.rawRun(`UPDATE "${table}" SET ${setClause} WHERE id = ?`, [...Object.values(fields), row_id])
    }
  }

  async applyBatch(changes: ChangeRecord[]): Promise<void> {
    for (const change of changes) {
      await this.apply(change)
    }
  }
}
