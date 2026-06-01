import type { Row } from '../types/adapter'
import type { ConflictMeta, ConflictResolutionStrategy, ManualResolverFn } from '../types/conflict'

export class ConflictResolver {
  private strategy: ConflictResolutionStrategy
  private manualResolver?: ManualResolverFn

  constructor(strategy: ConflictResolutionStrategy = 'last-write-wins', manualResolver?: ManualResolverFn) {
    this.strategy = strategy
    this.manualResolver = manualResolver
  }

  async resolve(local: Row, remote: Row, meta: ConflictMeta): Promise<Row> {
    if (this.strategy === 'last-write-wins') return meta.remote_timestamp >= meta.local_timestamp ? remote : local
    if (this.strategy === 'first-write-wins') return meta.local_timestamp <= meta.remote_timestamp ? local : remote
    if (this.strategy === 'manual' && this.manualResolver) {
      const result = await this.manualResolver(local, remote, meta)
      return result === 'local' ? local : result === 'remote' ? remote : result
    }
    return meta.remote_timestamp >= meta.local_timestamp ? remote : local
  }

  setStrategy(strategy: ConflictResolutionStrategy): void { this.strategy = strategy }
  setManualResolver(fn: ManualResolverFn): void { this.manualResolver = fn }
}
