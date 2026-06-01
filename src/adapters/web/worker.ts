interface WorkerMessage {
  id: string
  type: 'open' | 'close' | 'query' | 'run'
  sql?: string
  params?: unknown[]
  dbName?: string
  encryptionKey?: string
}

interface WorkerResponse {
  id: string
  result?: unknown
  error?: string
}

let db: unknown = null

async function init() {
  self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { id, type, sql, params, dbName } = event.data

    try {
      let result: unknown

      if (type === 'open') {
        // @ts-expect-error sqlite-wasm dynamic import
        const sqlite3InitModule = (await import('@sqlite.org/sqlite-wasm')).default
        const sqlite3 = await sqlite3InitModule()

        if (sqlite3.oo1.OpfsDb) {
          db = new sqlite3.oo1.OpfsDb(`/${dbName}.db`)
        } else {
          db = new sqlite3.oo1.DB(`/${dbName}.db`, 'ct')
        }
        result = { ok: true }
      } else if (type === 'query') {
        const rows: unknown[] = []
        ;(db as { exec(opts: object): void }).exec({
          sql: sql!,
          bind: params ?? [],
          rowMode: 'object',
          callback: (row: unknown) => rows.push(row)
        })
        result = rows
      } else if (type === 'run') {
        ;(db as { exec(opts: object): void }).exec({ sql: sql!, bind: params ?? [] })
        result = { lastInsertRowid: (db as { lastInsertRowid: number }).lastInsertRowid, changes: 1 }
      } else if (type === 'close') {
        ;(db as { close(): void }).close()
        db = null
        result = { ok: true }
      }

      self.postMessage({ id, result } satisfies WorkerResponse)
    } catch (err) {
      self.postMessage({ id, error: String(err) } satisfies WorkerResponse)
    }
  }
}

init()
