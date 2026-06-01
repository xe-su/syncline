export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  factor?: number
  onRetry?: (attempt: number, error: Error) => void
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 5, initialDelay = 1000, maxDelay = 30000, factor = 2, onRetry } = options
  let attempt = 0
  let delay = initialDelay

  while (true) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt >= maxAttempts) throw err
      onRetry?.(attempt, err as Error)
      await new Promise(r => setTimeout(r, delay))
      delay = Math.min(delay * factor, maxDelay)
    }
  }
}
