import type { ChangeRecord } from '../types/sync'
import { hlcNow } from '../utils/clock'

export class ChangeCapture {
  constructor(
    private clientId: string,
    private tenantId: string,
    private onCapture: (change: ChangeRecord) => void
  ) {}

  captureInsert(table: string, row_id: string, payload: Record<string, unknown>): void {
    this.onCapture({
      id: crypto.randomUUID(),
      table, row_id, operation: 'INSERT', payload,
      seq: 0, timestamp: hlcNow(),
      client_id: this.clientId, tenant_id: this.tenantId
    })
  }

  captureUpdate(table: string, row_id: string, payload: Record<string, unknown>): void {
    this.onCapture({
      id: crypto.randomUUID(),
      table, row_id, operation: 'UPDATE', payload,
      seq: 0, timestamp: hlcNow(),
      client_id: this.clientId, tenant_id: this.tenantId
    })
  }

  captureDelete(table: string, row_id: string): void {
    this.onCapture({
      id: crypto.randomUUID(),
      table, row_id, operation: 'DELETE', payload: null,
      seq: 0, timestamp: hlcNow(),
      client_id: this.clientId, tenant_id: this.tenantId
    })
  }
}
