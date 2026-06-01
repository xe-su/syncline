import type { DBWrapper } from '../db/wrapper'
import type { Migration, MigrationResult } from '../types/migration'
import { MigrationTracker } from './tracker'
import { validateMigrations } from './validator'

export class MigrationRunner {
  private tracker: MigrationTracker

  constructor(private db: DBWrapper, private migrations: Migration[]) {
    this.tracker = new MigrationTracker(db)
    validateMigrations(migrations)
  }

  async run(): Promise<MigrationResult> {
    const start = Date.now()
    await this.tracker.ensureTable()
    const currentVersion = await this.tracker.getCurrentVersion()
    const pending = this.migrations.filter(m => m.version > currentVersion)
    const applied: number[] = []

    for (const migration of pending) {
      const t0 = Date.now()
      if (typeof migration.up === 'string') {
        await this.db.rawRun(migration.up)
      } else {
        await migration.up(this.db)
      }
      await this.tracker.markApplied(migration.version, migration.description, Date.now() - t0)
      applied.push(migration.version)
    }

    return { applied, currentVersion: await this.tracker.getCurrentVersion(), duration: Date.now() - start }
  }

  async rollback(toVersion: number): Promise<void> {
    const currentVersion = await this.tracker.getCurrentVersion()
    const toRollback = this.migrations
      .filter(m => m.version > toVersion && m.version <= currentVersion && m.down)
      .sort((a, b) => b.version - a.version)

    for (const migration of toRollback) {
      if (typeof migration.down === 'string') {
        await this.db.rawRun(migration.down!)
      } else {
        await migration.down!(this.db)
      }
      await this.tracker.markRolledBack(migration.version)
    }
  }

  async getCurrentVersion(): Promise<number> {
    await this.tracker.ensureTable()
    return this.tracker.getCurrentVersion()
  }

  async getHistory() {
    await this.tracker.ensureTable()
    return this.tracker.getApplied()
  }
}
