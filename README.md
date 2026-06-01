# SyncLine

**Offline-first sync SDK for cross-platform apps** — web, mobile (Capacitor), and desktop (Tauri/Electron).

SyncLine gives your app a local SQLite database that syncs automatically in real-time via WebSocket, queues writes when offline, and resolves conflicts when devices reconnect.

---

## Features

| Feature | Description |
|---------|-------------|
| **Platform adapters** | sqlite-wasm (web/OPFS), @capacitor-community/sqlite (iOS/Android), better-sqlite3 (desktop) |
| **DB Wrapper** | Platform-agnostic query API — same code on all platforms |
| **Live Sync** | WebSocket-based real-time change propagation |
| **Sync Engine** | Tracks sequence numbers, handles catch-up on reconnect |
| **Gap Recovery** | REST-based recovery for missed changes when offline for long periods |
| **Schema Migrations** | Versioned, ordered migrations with rollback support |
| **Offline Write Queue** | Queues writes to SQLite when offline, replays in order on reconnect |
| **Conflict Resolution** | Last-write-wins (default) + manual merge hook API |
| **Encryption at Rest** | SQLCipher per platform (Keychain/Keystore/OS keychain for key storage) |
| **Auth Token Handling** | JWT caching, background refresh, offline fallback mode |

---

## Quick Start

```typescript
import { WebAdapter, DBWrapper, SyncEngine, MigrationRunner } from 'syncline'

// 1. Open database
const adapter = new WebAdapter()
await adapter.open('myapp')

const db = new DBWrapper(adapter)

// 2. Run migrations
const runner = new MigrationRunner(db, [
  {
    version: 1,
    description: 'Create todos table',
    up: 'CREATE TABLE todos (id TEXT PRIMARY KEY, text TEXT, done INTEGER DEFAULT 0, updated_at TEXT, _version INTEGER DEFAULT 1, _deleted INTEGER DEFAULT 0)'
  }
])
await runner.run()

// 3. Start sync engine
const engine = new SyncEngine(db, {
  wsUrl: 'ws://your-server/ws',
  restUrl: 'http://your-server',
  tenantId: 'my-workspace',
  getToken: async () => 'your-jwt-token'
})
await engine.start()

// 4. Write data — changes sync automatically
await db.insert('todos', {
  id: crypto.randomUUID(),
  text: 'Build something offline-first',
  done: 0,
  updated_at: new Date().toISOString()
})
```

---

## Platform Setup

### Web (sqlite-wasm + OPFS)
Requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers:
```typescript
// vite.config.ts
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  }
}
```

### Mobile (Capacitor)
```typescript
import { CapacitorAdapter } from 'syncline'
const adapter = new CapacitorAdapter()
await adapter.open('myapp', { encryptionKey: 'your-key' })
```

### Desktop (Tauri / Electron)
```typescript
import { DesktopAdapter } from 'syncline'
const adapter = new DesktopAdapter()
await adapter.open('/path/to/myapp.db')
```

---

## Offline Write Queue

```typescript
import { OfflineWriteQueue } from 'syncline'

const queue = new OfflineWriteQueue(db, wsClient)
await queue.init()

// When offline — enqueue instead of sending
await queue.enqueue(changeRecord)

// On reconnect — drain automatically
engine.on('connected', async () => {
  await queue.drain()
})

queue.on('drained', (result) => {
  console.log(`Sent: ${result.sent}, Failed: ${result.failed}`)
})
```

---

## Conflict Resolution

```typescript
import { ConflictResolver } from 'syncline'

// Last-write-wins (default)
const resolver = new ConflictResolver('last-write-wins')

// Manual merge hook
const resolver = new ConflictResolver('manual', async (local, remote, meta) => {
  // Show UI, let user pick
  return 'local'  // or 'remote' or a merged Row
})
```

---

## Schema Migrations

```typescript
const migrations = [
  {
    version: 1,
    description: 'Initial schema',
    up: async (db) => {
      await db.rawRun('CREATE TABLE ...')
    },
    down: async (db) => {
      await db.rawRun('DROP TABLE ...')
    }
  },
  {
    version: 2,
    description: 'Add index',
    up: 'CREATE INDEX idx_todos_done ON todos(done)'
  }
]

const runner = new MigrationRunner(db, migrations)
const result = await runner.run()
console.log(`Applied: ${result.applied}, Version: ${result.currentVersion}`)
```

---

## Encryption at Rest

```typescript
import { EncryptionManager } from 'syncline'

const enc = new EncryptionManager({
  enabled: true,
  keyDerivation: 'passphrase',
  passphrase: 'user-passphrase',
  kdfIterations: 256000
})

await enc.applyToAdapter(adapter, 'myapp')
```

---

## Backend

SyncLine needs a sync server. See [syncline-testbed](https://github.com/xe-su/syncline-testbed) for a complete Node.js + Express + PostgreSQL + WebSocket reference implementation.

### Server endpoints expected:
```
WS   /ws?token=<jwt>              — Live sync connection
GET  /sync/changes?since_seq=N    — Gap recovery (paginated)
POST /auth/token                  — Get access + refresh tokens
POST /auth/refresh                — Refresh access token
```

---

## Internal Tables

SyncLine creates these tables in your SQLite database (prefixed `_syncline_`):

| Table | Purpose |
|-------|---------|
| `_syncline_migrations` | Applied migration history |
| `_syncline_meta` | client_id, last_seq, tenant_id |
| `_syncline_queue` | Offline write queue |
| `_syncline_conflicts` | Unresolved conflict log |

---

## Stack

- **Language:** TypeScript
- **Web DB:** [@sqlite.org/sqlite-wasm](https://sqlite.org/wasm/doc/trunk/index.md) (OPFS-backed)
- **Mobile DB:** [@capacitor-community/sqlite](https://github.com/capacitor-community/sqlite)
- **Desktop DB:** [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Sync:** WebSocket (live) + REST (gap recovery)
- **Encryption:** SQLCipher via platform cipher bindings
- **Clock:** Hybrid Logical Clock (HLC) for change ordering

---

## License

MIT
