import { EventEmitter } from '../utils/event-emitter'
import type { SyncMessage } from '../types/sync'

interface WSClientEvents {
  connected: void
  disconnected: void
  message: SyncMessage
  error: Error
  reconnecting: { attempt: number }
  [key: string]: unknown
}

export class WebSocketClient extends EventEmitter<WSClientEvents> {
  private ws: WebSocket | null = null
  private reconnectAttempt = 0
  private destroyed = false
  private pingInterval: ReturnType<typeof setInterval> | null = null

  constructor(private url: string, private getToken: () => Promise<string>) {
    super()
  }

  async connect(): Promise<void> {
    const token = await this.getToken()
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.url}?token=${encodeURIComponent(token)}`)

      this.ws.onopen = () => {
        this.reconnectAttempt = 0
        this.startPing()
        this.emit('connected', undefined)
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as SyncMessage
          this.emit('message', msg)
        } catch {}
      }

      this.ws.onclose = () => {
        this.stopPing()
        this.emit('disconnected', undefined)
        if (!this.destroyed) this.scheduleReconnect()
      }

      this.ws.onerror = () => reject(new Error('WebSocket connection failed'))
    })
  }

  send(msg: SyncMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  disconnect(): void {
    this.destroyed = true
    this.stopPing()
    this.ws?.close()
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private scheduleReconnect(): void {
    this.reconnectAttempt++
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 30000)
    this.emit('reconnecting', { attempt: this.reconnectAttempt })
    setTimeout(() => { if (!this.destroyed) this.connect().catch(() => {}) }, delay)
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => this.send({ type: 'PING' }), 30000)
  }

  private stopPing(): void {
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null }
  }
}
