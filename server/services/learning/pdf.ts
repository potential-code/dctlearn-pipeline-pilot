import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from 'pdf-lib'

/**
 * PDFs drawn with pdf-lib (no headless browser), ported from the learning-module template.
 * Standard fonts only cover WinAnsi, so characters outside it (e.g. Arabic) are replaced; an
 * embedded Arabic font is a follow-up (needs a font file in the repo).
 */

export function winAnsi(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .split('')
    .map((ch) => {
      const c = ch.charCodeAt(0)
      const ok = c === 9 || c === 10 || c === 13 || (c >= 32 && c <= 126) || (c >= 160 && c <= 255)
      return ok ? ch : '?'
    })
    .join('')
}

const INK = rgb(0.12, 0.16, 0.21)
const MUTED = rgb(0.45, 0.5, 0.56)
const ACCENT = rgb(0.93, 0.24, 0.26)
const HAIRLINE = rgb(0.85, 0.85, 0.85)

function centered(
  page: PDFPage,
  text: string,
  o: { y: number; font: PDFFont; size: number; color?: ReturnType<typeof rgb>; min?: number },
) {
  const width = page.getWidth()
  const t = winAnsi(text)
  let size = o.size
  while (size > (o.min ?? 8) && o.font.widthOfTextAtSize(t, size) > width - 160) size -= 1
  page.drawText(t, {
    x: (width - o.font.widthOfTextAtSize(t, size)) / 2,
    y: o.y,
    size,
    font: o.font,
    color: o.color ?? INK,
  })
}

export async function renderCertificatePdf(input: {
  learnerName: string
  courseTitle: string
  serial: string
  issuedAt: Date
  issuer: string
  signatureName?: string
  signatureTitle?: string
  verifyUrl: string
}) {
  const pdf = await PDFDocument.create()
  pdf.setTitle(winAnsi(`${input.courseTitle} - ${input.learnerName}`))
  pdf.setCreationDate(input.issuedAt)
  const page = pdf.addPage([841.89, 595.28])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const W = page.getWidth()
  const H = page.getHeight()
  page.drawRectangle({
    x: 28,
    y: 28,
    width: W - 56,
    height: H - 56,
    borderColor: ACCENT,
    borderWidth: 2,
  })
  page.drawRectangle({
    x: 36,
    y: 36,
    width: W - 72,
    height: H - 72,
    borderColor: HAIRLINE,
    borderWidth: 0.5,
  })
  centered(page, 'DCT Learn', { y: H - 100, font: bold, size: 16, color: ACCENT })
  centered(page, 'Certificate of Completion', { y: H - 150, font: bold, size: 32 })
  centered(page, 'This is to certify that', { y: H - 200, font: regular, size: 13, color: MUTED })
  centered(page, input.learnerName, { y: H - 250, font: bold, size: 30, min: 18 })
  centered(page, 'has successfully completed', {
    y: H - 295,
    font: regular,
    size: 13,
    color: MUTED,
  })
  centered(page, input.courseTitle, { y: H - 335, font: bold, size: 22, min: 13 })
  centered(page, `Completed on ${input.issuedAt.toISOString().slice(0, 10)}`, {
    y: H - 375,
    font: regular,
    size: 11,
  })
  centered(page, input.issuer, { y: H - 395, font: regular, size: 11, color: MUTED })
  if (input.signatureName) {
    centered(page, input.signatureName, { y: 110, font: bold, size: 11 })
    if (input.signatureTitle)
      centered(page, input.signatureTitle, { y: 96, font: regular, size: 9, color: MUTED })
  }
  centered(page, `Certificate serial: ${input.serial}`, {
    y: 58,
    font: regular,
    size: 9,
    color: MUTED,
  })
  centered(page, `Verify at ${input.verifyUrl}`, { y: 46, font: regular, size: 8, color: MUTED })
  return pdf.save()
}

/** Word-wraps `text` to `maxWidth` at `size`. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = []
  for (const para of winAnsi(text).split(/\r?\n/)) {
    let line = ''
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        lines.push(line)
        line = word
      } else line = next
    }
    lines.push(line)
  }
  return lines
}

export async function renderActionPlanPdf(input: {
  title: string
  learnerName: string
  courseTitle: string
  items: { question: string; answer: string }[]
  generatedAt: Date
}) {
  const pdf = await PDFDocument.create()
  pdf.setTitle(winAnsi(input.title))
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const W = 595.28
  const H = 841.89
  const margin = 56
  let page = pdf.addPage([W, H])
  let y = H - margin
  const line = (text: string, font: PDFFont, size: number, color = INK) => {
    for (const l of wrap(text, font, size, W - margin * 2)) {
      if (y < margin + size) {
        page = pdf.addPage([W, H])
        y = H - margin
      }
      page.drawText(l, { x: margin, y, size, font, color })
      y -= size * 1.45
    }
  }
  line(input.title, bold, 20)
  line(`${input.courseTitle} - ${input.learnerName}`, regular, 11, MUTED)
  y -= 10
  input.items.forEach((item, i) => {
    line(`${i + 1}. ${item.question}`, bold, 12)
    line(item.answer || '-', regular, 11)
    y -= 8
  })
  line(
    `Generated ${input.generatedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    regular,
    8,
    MUTED,
  )
  return pdf.save()
}
