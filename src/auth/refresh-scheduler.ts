export class RefreshScheduler {
  private timer: ReturnType<typeof setTimeout> | null = null

  schedule(expiresAt: number, buffer: number, onRefresh: () => Promise<void>): void {
    this.cancel()
    const delay = expiresAt - Date.now() - buffer
    if (delay <= 0) { onRefresh().catch(() => {}); return }
    this.timer = setTimeout(() => onRefresh().catch(() => {}), delay)
  }

  cancel(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
  }
}
