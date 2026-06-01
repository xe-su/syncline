import type { Row, WhereClause } from '../types/adapter'

export function buildWhereClause(where: WhereClause): { sql: string; params: unknown[] } {
  const keys = Object.keys(where)
  if (keys.length === 0) return { sql: '', params: [] }
  const sql = 'WHERE ' + keys.map(k => `"${k}" = ?`).join(' AND ')
  return { sql, params: keys.map(k => where[k]) }
}

export function buildInsert(table: string, data: Row): { sql: string; params: unknown[] } {
  const keys = Object.keys(data)
  const cols = keys.map(k => `"${k}"`).join(', ')
  const placeholders = keys.map(() => '?').join(', ')
  return {
    sql: `INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`,
    params: keys.map(k => data[k])
  }
}

export function buildUpdate(table: string, data: Partial<Row>, where: WhereClause): { sql: string; params: unknown[] } {
  const setKeys = Object.keys(data)
  const setClause = setKeys.map(k => `"${k}" = ?`).join(', ')
  const whereResult = buildWhereClause(where)
  return {
    sql: `UPDATE "${table}" SET ${setClause}${whereResult.sql ? ' ' + whereResult.sql : ''}`,
    params: [...setKeys.map(k => data[k]), ...whereResult.params]
  }
}

export function buildDelete(table: string, where: WhereClause): { sql: string; params: unknown[] } {
  const whereResult = buildWhereClause(where)
  return {
    sql: `DELETE FROM "${table}"${whereResult.sql ? ' ' + whereResult.sql : ''}`,
    params: whereResult.params
  }
}
