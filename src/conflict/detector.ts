import type { Row } from '../types/adapter'

export interface ConflictDetectionResult {
  isConflict: boolean
  reason?: string
}

export function detectConflict(local: Row, remote: Row): ConflictDetectionResult {
  const localVersion = local._version as number | undefined
  const remoteVersion = remote._version as number | undefined
  if (localVersion === undefined || remoteVersion === undefined) return { isConflict: false }
  if (localVersion === remoteVersion) return { isConflict: true, reason: 'Same version on both sides' }
  return { isConflict: false }
}
