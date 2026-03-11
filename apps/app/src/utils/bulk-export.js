import QRCodeStyling from 'qr-code-styling'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

function createQRCode(url, { fgColor, bgColor, dotStyle, logo, size }) {
  return new QRCodeStyling({
    width: size,
    height: size,
    type: 'canvas',
    data: url,
    dotsOptions: { color: fgColor, type: dotStyle },
    backgroundOptions: { color: bgColor },
    cornersSquareOptions: { type: 'extra-rounded' },
    imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
    image: logo || undefined,
    qrOptions: { errorCorrectionLevel: 'H' },
  })
}

async function renderToBlob(qr, format) {
  const container = document.createElement('div')
  qr.append(container)

  // Wait for rendering
  await new Promise((r) => setTimeout(r, 100))

  if (format === 'svg') {
    const svgEl = container.querySelector('svg')
    if (!svgEl) throw new Error('SVG not found')
    const svgData = new XMLSerializer().serializeToString(svgEl)
    return new Blob([svgData], { type: 'image/svg+xml' })
  }

  const canvas = container.querySelector('canvas')
  if (!canvas) throw new Error('Canvas not found')

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      format === 'webp' ? 'image/webp' : 'image/png'
    )
  })
}

const CHUNK_SIZE = 10

export async function generateZip(entries, options, format, onProgress) {
  const zip = new JSZip()
  const validEntries = entries.filter((e) => e.valid)
  const ext = format === 'svg' ? 'svg' : format === 'webp' ? 'webp' : 'png'

  for (let i = 0; i < validEntries.length; i += CHUNK_SIZE) {
    const chunk = validEntries.slice(i, i + CHUNK_SIZE)
    const promises = chunk.map(async (entry) => {
      const qr = createQRCode(entry.url, options)
      const blob = await renderToBlob(qr, format)
      zip.file(`${entry.filename}.${ext}`, blob)
    })
    await Promise.all(promises)
    onProgress?.(Math.min(i + CHUNK_SIZE, validEntries.length), validEntries.length)

    // Yield to UI between chunks
    await new Promise((r) => setTimeout(r, 0))
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, 'qrni-bulk.zip')
}

export async function generatePdf(entries, options, onProgress) {
  const validEntries = entries.filter((e) => e.valid)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = 210
  const pageH = 297
  const margin = 15
  const cols = 3
  const cellW = (pageW - margin * 2) / cols
  const qrSize = cellW - 10
  const cellH = qrSize + 16 // QR + label space
  const rows = Math.floor((pageH - margin * 2) / cellH)
  const perPage = cols * rows

  for (let i = 0; i < validEntries.length; i += CHUNK_SIZE) {
    const chunk = validEntries.slice(i, i + CHUNK_SIZE)

    for (const entry of chunk) {
      const idx = validEntries.indexOf(entry)
      const pageIdx = Math.floor(idx / perPage)
      const posOnPage = idx % perPage
      const col = posOnPage % cols
      const row = Math.floor(posOnPage / cols)

      if (posOnPage === 0 && pageIdx > 0) pdf.addPage()

      const x = margin + col * cellW + (cellW - qrSize) / 2
      const y = margin + row * cellH

      const qr = createQRCode(entry.url, { ...options, size: 512 })
      const container = document.createElement('div')
      qr.append(container)
      await new Promise((r) => setTimeout(r, 100))

      const canvas = container.querySelector('canvas')
      if (canvas) {
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize)
      }

      pdf.setFontSize(8)
      pdf.setTextColor(100)
      const labelText = entry.label.length > 25
        ? entry.label.slice(0, 22) + '...'
        : entry.label
      pdf.text(labelText, x + qrSize / 2, y + qrSize + 6, { align: 'center' })
    }

    onProgress?.(Math.min(i + CHUNK_SIZE, validEntries.length), validEntries.length)
    await new Promise((r) => setTimeout(r, 0))
  }

  pdf.save('qrni-bulk.pdf')
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
