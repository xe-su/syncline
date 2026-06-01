import { EventEmitter } from '../utils/event-emitter'
import { WebSocketClient } from './websocket-client'
import { ChangeCapture } from './change-capture'
import { ChangeApplier } from './change-applier'
import { SequenceTracker } from './sequence-tracker'
import { fetchMissedChanges } from './gap-recovery'
import type { DBWrapper } from '../db/wrapper'
import type { ChangeRecord, SyncState } from '../types/sync'
import type { Logger } from '../utils/logger'
import { consoleLogger } from '../utils/logger'

export interface SyncEngineConfig {
  wsUrl: string
  restUrl: string
  tenantId: string
  getToken: () => Promise<string>
  logger?: Logger
}

interface SyncEngineEvents {
  connected: void
  disconnected: void
  change: ChangeRecord
  synced: { seq: number }
  error: Error
}

export class SyncEngine extends EventEmitter<SyncEngineEvents> {
  private wsClient: WebSocketClient
  private capture: ChangeCapture
  private applier: ChangeApplier
  private seqTracker: SequenceTracker
  private clientId: string = ''
  private logger: Logger
  private started = false

  constructor(private db: DBWrapper, private config: SyncEngineConfig) {
    super()
    this.logger = config.logger ?? consoleLogger
    this.wsClient = new WebSocketClient(config.wsUrl, config.getToken)
    this.applier = new ChangeApplier(db)
    this.seqTracker = new SequenceTracker(db)
    this.capture = new ChangeCapture('', config.tenantId, (change) => this.onLocalChange(change))
  }

  async start(): Promise<void> {
    if (this.started) return
    this.started = true

    await this.seqTracker.ensureTables()
    this.clientId = await this.seqTracker.getClientId()
    const lastSeq = await this.seqTracker.getLastSeq()

    try {
      for await (const changes of fetchMissedChanges(lastSeq, {
        endpoint: this.config.restUrl,
        tenantId: this.config.tenantId,
        getToken: this.config.getToken
      })) {
        await this.applier.applyBatch(changes)
        const maxSeq = Math.max(...changes.map(c => c.seq))
        await this.seqTracker.setLastSeq(maxSeq)
      }
    } catch (err) {
      this.logger.warn('Gap recovery failed', err)
    }

    this.wsClient.on('connected', async () => {
      const seq = await this.seqTracker.getLastSeq()
      this.wsClient.send({ type: 'HELLO', client_id: this.clientId, tenant_id: this.config.tenantId, last_seq: seq })
      this.emit('connected', undefined)
    })

    this.wsClient.on('message', async (msg) => {
      if (msg.type === 'CHANGE') {
        await this.applier.apply(msg.change)
        await this.seqTracker.setLastSeq(msg.change.seq)
        this.emit('change', msg.change)
      } else if (msg.type === 'CHANGES') {
        await this.applier.applyBatch(msg.changes)
        if (msg.changes.length > 0) {
          await this.seqTracker.setLastSeq(Math.max(...msg.changes.map(c => c.seq)))
        }
      } else if (msg.type === 'READY') {
        this.emit('synced', { seq: msg.server_seq })
      }
    })

    this.wsClient.on('disconnected', () => this.emit('disconnected', undefined))
    await this.wsClient.connect()
  }

  stop(): void {
    this.wsClient.disconnect()
    this.started = false
  }

  getCapture(): ChangeCapture { return this.capture }

  async getState(): Promise<SyncState> {
    const lastSeq = await this.seqTracker.getLastSeq()
    return { lastSeq, clientId: this.clientId, tenantId: this.config.tenantId, connected: this.wsClient.isConnected, syncing: false }
  }

  private onLocalChange(change: ChangeRecord): void {
    if (this.wsClient.isConnected) this.wsClient.send({ type: 'CHANGE', change })
  }
}
