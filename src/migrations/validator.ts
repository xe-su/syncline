import type { Migration } from '../types/migration'

export class MigrationValidationError extends Error {
  constructor(message: string) {
    super(`[SyncLine Migrations] ${message}`)
    this.name = 'MigrationValidationError'
  }
}

export function validateMigrations(migrations: Migration[]): void {
  if (migrations.length === 0) return
  const versions = migrations.map(m => m.version)
  const unique = new Set(versions)
  if (unique.size !== versions.length) {
    throw new MigrationValidationError('Duplicate migration versions found')
  }
  const sorted = [...versions].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      throw new MigrationValidationError(`Migration version gap: expected ${i + 1}, found ${sorted[i]}`)
    }
  }
}
