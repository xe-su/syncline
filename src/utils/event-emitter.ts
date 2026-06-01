type Listener<T> = (data: T) => void

export class EventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<string, Set<Listener<unknown>>>()

  on<K extends keyof Events & string>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(listener as Listener<unknown>)
    return () => this.off(event, listener)
  }

  off<K extends keyof Events & string>(event: K, listener: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>)
  }

  emit<K extends keyof Events & string>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(l => l(data))
  }

  removeAllListeners(event?: string): void {
    if (event) this.listeners.delete(event)
    else this.listeners.clear()
  }
}
