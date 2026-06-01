export function isOPFSSupported(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage
}

export async function getOPFSRoot(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory()
}

export function getOPFSDbPath(dbName: string): string {
  return `syncline-${dbName}.db`
}
