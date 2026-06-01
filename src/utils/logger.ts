export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  debug(msg: string, ...args: unknown[]): void
  info(msg: string, ...args: unknown[]): void
  warn(msg: string, ...args: unknown[]): void
  error(msg: string, ...args: unknown[]): void
}

export const consoleLogger: Logger = {
  debug: (msg, ...args) => console.debug(`[SyncLine] ${msg}`, ...args),
  info: (msg, ...args) => console.info(`[SyncLine] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[SyncLine] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[SyncLine] ${msg}`, ...args),
}

export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}
