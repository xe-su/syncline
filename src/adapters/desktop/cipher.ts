export function initCipher(db: { pragma(sql: string): void }, key: string): void {
  db.pragma(`key = '${key}'`)
}
