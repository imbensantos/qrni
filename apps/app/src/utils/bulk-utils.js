import Papa from 'papaparse'

const MAX_ENTRIES = 500

export function isValidUrl(url) {
  return typeof url === 'string' &&
    (url.startsWith('http://') || url.startsWith('https://'))
}

export function sanitizeLabel(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .slice(0, 80) || 'qr-code'
}

export function deduplicateLabels(entries) {
  const counts = {}
  return entries.map((entry) => {
    const base = entry.filename
    counts[base] = (counts[base] || 0) + 1
    const filename = counts[base] > 1 ? `${base}-${counts[base]}` : base
    return { ...entry, filename }
  })
}

export function parseCSV(text) {
  const result = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  const entries = result.data.slice(0, MAX_ENTRIES).map((row, i) => {
    const label = row.label || row.Label || row.name || row.Name || ''
    const url = row.url || row.URL || row.link || row.Link || ''
    const valid = isValidUrl(url)
    const error = !label.trim()
      ? 'Missing label'
      : !url.trim()
        ? 'Missing URL'
        : !valid
          ? 'Invalid URL (must start with http:// or https://)'
          : null
    return {
      index: i + 1,
      label: label.trim(),
      url: url.trim(),
      filename: sanitizeLabel(label),
      valid: !!label.trim() && valid,
      error,
    }
  })

  return deduplicateLabels(entries)
}

export function parseJSON(text) {
  let data
  try {
    data = JSON.parse(text.trim())
  } catch {
    return [{ index: 1, label: '', url: '', filename: '', valid: false, error: 'Invalid JSON' }]
  }

  if (!Array.isArray(data)) {
    return [{ index: 1, label: '', url: '', filename: '', valid: false, error: 'JSON must be an array' }]
  }

  const entries = data.slice(0, MAX_ENTRIES).map((item, i) => {
    const label = item.label || item.name || ''
    const url = item.url || item.link || ''
    const valid = isValidUrl(url)
    const error = !label.trim()
      ? 'Missing label'
      : !url.trim()
        ? 'Missing URL'
        : !valid
          ? 'Invalid URL (must start with http:// or https://)'
          : null
    return {
      index: i + 1,
      label: label.trim(),
      url: url.trim(),
      filename: sanitizeLabel(label),
      valid: !!label.trim() && valid,
      error,
    }
  })

  return deduplicateLabels(entries)
}

export function parseFile(text, filename) {
  if (filename.toLowerCase().endsWith('.json')) return parseJSON(text)
  return parseCSV(text)
}
