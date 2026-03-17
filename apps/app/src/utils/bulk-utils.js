import Papa from "papaparse";

const MAX_ENTRIES = 500;

export function isValidUrl(url) {
  return (
    typeof url === "string" &&
    (url.startsWith("http://") || url.startsWith("https://"))
  );
}

export function sanitizeLabel(label) {
  return (
    String(label)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 80) || "qr-code"
  );
}

export function deduplicateLabels(entries) {
  const counts = {};
  return entries.map((entry) => {
    const base = entry.filename;
    counts[base] = (counts[base] || 0) + 1;
    const filename = counts[base] > 1 ? `${base}-${counts[base]}` : base;
    return { ...entry, filename };
  });
}

const HEADER_NAMES = ["label", "name", "url", "link"];

function hasHeaderRow(fields) {
  return fields.some((f) => HEADER_NAMES.includes(f.toLowerCase().trim()));
}

export function parseCSV(text) {
  // First try with headers
  const withHeader = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  // If the first row looks like a header (contains known column names), use it
  if (withHeader.meta.fields && hasHeaderRow(withHeader.meta.fields)) {
    const entries = withHeader.data.slice(0, MAX_ENTRIES).map((row, i) => {
      const label = (
        row.label ||
        row.Label ||
        row.name ||
        row.Name ||
        ""
      ).trim();
      const url = (row.url || row.URL || row.link || row.Link || "").trim();
      return buildEntry(i, label, url);
    });
    return deduplicateLabels(entries);
  }

  // No header — treat as two-column: label, url
  const noHeader = Papa.parse(text.trim(), {
    header: false,
    skipEmptyLines: true,
  });

  const entries = noHeader.data.slice(0, MAX_ENTRIES).map((cols, i) => {
    const label = (cols[0] || "").trim();
    const url = (cols[1] || "").trim();
    return buildEntry(i, label, url);
  });

  return deduplicateLabels(entries);
}

function buildEntry(i, label, url) {
  const valid = isValidUrl(url);
  const error = !label
    ? "Missing label"
    : !url
      ? "Missing URL"
      : !valid
        ? "Invalid URL (must start with http:// or https://)"
        : null;
  return {
    index: i + 1,
    label,
    url,
    filename: sanitizeLabel(label),
    valid: !!label && valid,
    error,
  };
}

export function parseJSON(text) {
  let data;
  try {
    data = JSON.parse(text.trim());
  } catch {
    return [
      {
        index: 1,
        label: "",
        url: "",
        filename: "",
        valid: false,
        error: "Invalid JSON",
      },
    ];
  }

  if (!Array.isArray(data)) {
    return [
      {
        index: 1,
        label: "",
        url: "",
        filename: "",
        valid: false,
        error: "JSON must be an array",
      },
    ];
  }

  const entries = data.slice(0, MAX_ENTRIES).map((item, i) => {
    const label = item.label || item.name || "";
    const url = item.url || item.link || "";
    const valid = isValidUrl(url);
    const error = !label.trim()
      ? "Missing label"
      : !url.trim()
        ? "Missing URL"
        : !valid
          ? "Invalid URL (must start with http:// or https://)"
          : null;
    return {
      index: i + 1,
      label: label.trim(),
      url: url.trim(),
      filename: sanitizeLabel(label),
      valid: !!label.trim() && valid,
      error,
    };
  });

  return deduplicateLabels(entries);
}

export function parseFile(text, filename) {
  if (filename.toLowerCase().endsWith(".json")) return parseJSON(text);
  return parseCSV(text);
}
