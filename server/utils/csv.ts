/**
 * Minimal RFC 4180 CSV: quoted fields, escaped quotes, CRLF/LF. Output neutralises spreadsheet
 * formula injection (cells starting with = + - @ tab CR are prefixed with ').
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const input = text.replace(/^﻿/, '')
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** Parses with a header row into objects keyed by lower-cased, trimmed header names. */
export function parseCsvObjects(text: string) {
  const [header, ...body] = parseCsv(text)
  if (!header) return { headers: [] as string[], rows: [] as Record<string, string>[] }
  const headers = header.map((h) => h.trim().toLowerCase())
  return {
    headers,
    rows: body.map((cells) =>
      Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()])),
    ),
  }
}

function cell(value: unknown) {
  let s =
    value === null || value === undefined
      ? ''
      : value instanceof Date
        ? value.toISOString()
        : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers: string[], rows: unknown[][]) {
  return `${[headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`
}
