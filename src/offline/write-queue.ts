import { EventEmitter } from '../utils/event-emitter'
import { QueueStore } from './queue-store'
import { ReplayEngine, type DrainResult } from './replay-engine'
import type { DBWrapper } from '../db/wrapper'
import type { WebSocketClient } from '../sync/websocket-client'
import type { ChangeRecord } from '../types/sync'

interface WriteQueueEvents {
  drained: DrainResult
  'item-failed': { queue_id: number; error: string }
  [key: string]: unknown
}

export class OfflineWriteQueue extends EventEmitter<WriteQueueEvents> {
  private store: QueueStore
  private replay: ReplayEngine

  constructor(db: DBWrapper, wsClient: WebSocketClient) {
    super()
    this.store = new QueueStore(db)
    this.replay = new ReplayEngine(this.store, wsClient)
  }

  async init(): Promise<void> { await this.store.ensureTable() }

  async enqueue(change: ChangeRecord): Promise<void> { await this.store.enqueue(change) }
  async getDepth(): Promise<number> { return this.store.getDepth() }
  async getItems() { return this.store.getAll() }
  async clear(): Promise<void> { await this.store.clear() }

  async drain(): Promise<DrainResult> {
    const result = await this.replay.drain()
    this.emit('drained', result)
    for (const err of result.errors) this.emit('item-failed', err)
    return result
  }
}
