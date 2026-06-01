# SyncLine

Offline-first sync SDK for cross-platform apps (web, mobile, desktop).

## Features
- Platform-agnostic SQLite adapter (web/capacitor/desktop)
- Real-time sync via WebSocket
- Offline write queue with replay on reconnect
- Schema migrations
- Conflict resolution (LWW + manual hooks)
- Encryption at rest (SQLCipher)
- Auth token handling with offline fallback

## Installation
```bash
npm install syncline
```
