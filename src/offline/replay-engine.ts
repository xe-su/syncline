import type { QueueStore } from './queue-store'
import type { WebSocketClient } from '../sync/websocket-client'

export interface DrainResult {
  sent: number
  failed: number
  errors: Array<{ queue_id: number; error: string }>
}

export class ReplayEngine {
  constructor(private store: QueueStore, private wsClient: WebSocketClient) {}

  async drain(): Promise<DrainResult> {
    const items = await this.store.getAll()
    let sent = 0, failed = 0
    const errors: Array<{ queue_id: number; error: string }> = []

    for (const item of items) {
      try {
        if (!this.wsClient.isConnected) {
          errors.push({ queue_id: item.queue_id, error: 'Not connected' })
          failed++
          continue
        }
        this.wsClient.send({ type: 'CHANGE', change: item.change })
        await this.store.remove(item.queue_id)
        sent++
      } catch (err) {
        await this.store.incrementAttempts(item.queue_id)
        errors.push({ queue_id: item.queue_id, error: String(err) })
        failed++
      }
    }
    return { sent, failed, errors }
  }
}
