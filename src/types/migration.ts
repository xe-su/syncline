import type { DBWrapper } from '../db/wrapper'

export interface Migration {
  version: number
  description: string
  up: string | ((db: DBWrapper) => Promise<void>)
  down?: string | ((db: DBWrapper) => Promise<void>)
}

export interface AppliedMigration {
  version: number
  description: string
  applied_at: string
  duration_ms: number
}

export interface MigrationResult {
  applied: number[]
  currentVersion: number
  duration: number
}
