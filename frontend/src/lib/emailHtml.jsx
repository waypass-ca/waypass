import { DEFAULT_SECTIONS, DEFAULT_PROGRESS_LABELS, SAMPLE } from '../components/dashboard/EmailEditorPage'

const STATUS_ORDER = ['pending', 'transit', 'cremation', 'complete']

const STATUS_SUBJECTS = {
  pending:   'Your case has been received',
  transit:   'Your loved one is now in transit',
  cremation: 'Your loved one has arrived at the crematorium',
  complete:  'Your case is now complete',
}

export function buildSubject(status, funeralHomeName) {
  const base = STATUS_SUBJECTS[status] ?? 'An update on your case'
  return funeralHomeName ? `${base} — ${funeralHomeName}` : base
}

export function buildEmailConfig(customizations, template) {
  const c = customizations ?? {}
  return {
    fontSize:        c.fontSize        ?? 13,
    headingSize:     c.headingSize     ?? 22,
    headingColor:    c.headingColor    ?? template.text,
    message:         c.message         ?? SAMPLE.message,
    greeting:        c.greeting        ?? '',
    progressLabels:  c.progressLabels  ?? [...DEFAULT_PROGRESS_LABELS],
    buttonLabel:     c.buttonLabel     ?? 'Contact',
    buttonRadius:    8,
    cardRadius:      10,
    footerName:      c.footerName      ?? SAMPLE.funeralHome,
    footerTagline:   c.footerTagline   ?? SAMPLE.tagline,
    footerAddress:   c.footerAddress   ?? '123 Memorial Lane · San Francisco · (415) 555-0100',
    footerCopyright: c.footerCopyright ?? `© 2024 ${SAMPLE.funeralHome} · Unsubscribe`,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// Inline SVG checkmark as a data URI so it renders in all email clients
const CHECK = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E`
const CHECK_SM = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E`

function f(font) { return `font-family:${font}` }

function dot24(bg, border, inner) {
  return `<div style="width:24px;height:24px;border-radius:50%;background-color:${bg};border:2px solid ${border};margin:0 auto"><table cellpadding="0" cellspacing="0" width="24" height="24" style="border-collapse:collapse"><tr><td align="center" valign="middle">${inner}</td></tr></table></div>`
}

function dot20(bg, border, inner) {
  return `<div style="width:20px;height:20px;border-radius:50%;background-color:${bg};border:2px solid ${border}"><table cellpadding="0" cellspacing="0" width="20" height="20" style="border-collapse:collapse"><tr><td align="center" valign="middle">${inner}</td></tr></table></div>`
}

function logoImg(logoUrl, t, size, shape) {
  const r = shape === 'circle' ? '50%' : shape === 'square' ? '0' : '6px'
  if (logoUrl) {
    return `<img src="${esc(logoUrl)}" alt="" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;object-fit:contain;border-radius:${r}" />`
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:${r};background-color:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3)"><table cellpadding="0" cellspacing="0" width="${size}" height="${size}" style="border-collapse:collapse"><tr><td align="center" valign="middle" style="font-size:13px;font-weight:700;color:${t.headerText || '#fff'};${f(t.font)}">EG</td></tr></table></div>`
}

function initials(name, fb = 'SM') {
  return (name || fb).trim().split(/\s+/).map(n => n[0] || '').join('').slice(0,2).toUpperCase() || fb
}

// ─── Per-template body padding ────────────────────────────────────────────────

const BODY_PADDING = {
  classic: '32px 48px',
  minimal: '36px 36px 28px',
  ember:   '28px 40px',
  dusk:    '30px 36px',
  garden:  '36px 40px',
  pearl:   '28px 36px',
}

// ─── Progress: Dots ──────────────────────────────────────────────────────────
// Two-row table: row 1 = dots + connecting lines at correct height
//                row 2 = labels centered under each dot
// The connecting line td uses valign=top + padding-top:11px so the 2px line
// sits exactly at the vertical center (12px) of the 24px dot circles.

function progressDots(t, stepIdx, labels) {
  const n = labels.length
  const lineColor = (i) => i < stepIdx ? t.progressActive : (t.border || '#E0E0E0')

  const dotCells = labels.map((_, i) => {
    const done = i <= stepIdx, active = i === stepIdx
    const bg     = done ? t.progressActive : 'transparent'
    const border = done ? t.progressActive : (t.border || '#E0E0E0')
    const inner  = (done && !active) ? `<img src="${CHECK}" width="10" height="10" alt="" style="display:block" />`
                 : active            ? `<div style="width:7px;height:7px;border-radius:50%;background-color:#fff;margin:0 auto"></div>`
                 : ''
    const dotTd = `<td align="center" valign="top" style="padding:0">${dot24(bg, border, inner)}</td>`
    const lineTd = i < n - 1
      ? `<td valign="top" style="padding-top:11px"><div style="height:2px;background-color:${lineColor(i)};font-size:0;line-height:0">&nbsp;</div></td>`
      : ''
    return dotTd + lineTd
  }).join('')

  const labelCells = labels.map((label, i) => {
    const done = i <= stepIdx
    const labelTd = `<td align="center" valign="top" style="padding-top:6px;padding-bottom:0"><div style="font-size:10px;color:${done ? t.text : t.muted};text-align:center;line-height:1.3;${f(t.font)}">${esc(label)}</div></td>`
    const spacerTd = i < n - 1 ? `<td></td>` : ''
    return labelTd + spacerTd
  }).join('')

  return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
  <tr>${dotCells}</tr>
  <tr>${labelCells}</tr>
</table>`
}

// ─── Progress: Bar ────────────────────────────────────────────────────────────

function progressBar(t, stepIdx, labels) {
  const pct = Math.round(((stepIdx + 1) / labels.length) * 100)
  const current = labels[stepIdx] || ''
  const labelCols = labels.map((l, i) => {
    const align = i === 0 ? 'left' : i === labels.length - 1 ? 'right' : 'center'
    return `<td align="${align}" style="font-size:9px;color:${i <= stepIdx ? t.progressActive : t.muted};font-weight:${i <= stepIdx ? 600 : 400};${f(t.font)}">${esc(l)}</td>`
  }).join('')

  return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:8px">
  <tr>
    <td style="font-size:12px;color:${t.text};font-weight:600;${f(t.font)}">${esc(current)}</td>
    <td align="right"><span style="font-size:11px;color:${t.accent};font-weight:700;background-color:${t.accent}20;padding:3px 10px;border-radius:99px;${f(t.font)}">${pct}%</span></td>
  </tr>
</table>
<div style="height:6px;border-radius:99px;background-color:${t.border || '#E8E0D8'};overflow:hidden;margin-bottom:8px"><div style="height:6px;width:${pct}%;background-color:${t.progressActive};border-radius:99px"></div></div>
<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>${labelCols}</tr></table>`
}

// ─── Progress: Pills ──────────────────────────────────────────────────────────

function progressPills(t, stepIdx, labels) {
  const cols = labels.map((l, i) => {
    const done = i <= stepIdx
    return `<td style="padding:0 3px"><div style="background-color:${done ? t.progressActive : (t.border || '#E8E0D8')};border-radius:8px;padding:8px 4px;text-align:center"><div style="font-size:9px;color:${done ? '#fff' : t.muted};font-weight:600;line-height:1.3;${f(t.font)}">${esc(l)}</div></div></td>`
  }).join('')
  return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>${cols}</tr></table>`
}

// ─── Progress: Timeline ───────────────────────────────────────────────────────

function progressTimeline(t, stepIdx, labels) {
  return labels.map((l, i) => {
    const done = i <= stepIdx, active = i === stepIdx
    const bg     = done ? t.progressActive : 'transparent'
    const border = done ? t.progressActive : (t.border || '#E0E0E0')
    const inner  = (done && !active) ? `<img src="${CHECK_SM}" width="9" height="9" alt="" style="display:block" />`
                 : active            ? `<div style="width:6px;height:6px;border-radius:50%;background-color:${t.progressActive};margin:0 auto"></div>`
                 : ''
    const connector = i < labels.length - 1
      ? `<div style="width:2px;height:20px;background-color:${i < stepIdx ? t.progressActive : (t.border || '#E0E0E0')};margin:2px auto 0"></div>`
      : ''
    return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
  <tr>
    <td valign="top" width="20">
      ${dot20(bg, border, inner)}
      ${connector}
    </td>
    <td style="padding-left:12px;padding-top:2px;padding-bottom:${i < labels.length - 1 ? '0' : '0'}">
      <div style="font-size:12px;color:${done ? t.text : t.muted};font-weight:${done ? 600 : 400};line-height:1.3;${f(t.font)}">${esc(l)}</div>
    </td>
  </tr>
</table>`
  }).join('\n')
}

// ─── Progress dispatcher ──────────────────────────────────────────────────────

const PROGRESS_VARIANT = { classic:'dots', minimal:'bar', ember:'bar', dusk:'pills', garden:'timeline', pearl:'pills' }

function renderProgress(t, stepIdx, labels) {
  const v = PROGRESS_VARIANT[t.layout] || 'dots'
  if (v === 'bar')      return progressBar(t, stepIdx, labels)
  if (v === 'pills')    return progressPills(t, stepIdx, labels)
  if (v === 'timeline') return progressTimeline(t, stepIdx, labels)
  return progressDots(t, stepIdx, labels)
}

// ─── Card wrapper (per-template styling) ─────────────────────────────────────

function card(t, cr, inner, extraBorderLeft = '') {
  let style
  if (t.layout === 'minimal') {
    style = `background-color:${t.cardBg};border-radius:${cr}px;padding:18px 22px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,0.07)`
  } else if (t.layout === 'pearl') {
    style = `background-color:${t.cardBg};border-radius:${cr}px;border-top:4px solid ${t.accent};border-left:1px solid ${t.border || '#EDD4DE'};border-right:1px solid ${t.border || '#EDD4DE'};border-bottom:1px solid ${t.border || '#EDD4DE'};padding:18px 22px;margin-bottom:14px`
  } else {
    style = `background-color:${t.cardBg};border-radius:${cr}px;border:1px solid ${t.border || '#E0E0E0'};padding:18px 22px;margin-bottom:14px`
  }
  return `<div style="${style}${extraBorderLeft}">${inner}</div>`
}

function sectionHead(text, t) {
  return text ? `<div style="font-size:10px;color:${t.muted};font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;${f(t.font)}">${esc(text)}</div>` : ''
}

// ─── Section: Message ─────────────────────────────────────────────────────────

function renderMessage(s, t, c) {
  const isItalic = t.layout === 'classic' || t.layout === 'ember'
  const innerStyle = t.layout !== 'pearl' && t.layout !== 'minimal'
    ? `border-left:3px solid ${t.accent};padding-left:14px` : ''
  const content = `<div style="${innerStyle}"><p style="font-size:${c.fontSize}px;color:${t.text}CC;line-height:1.8;margin:0;font-style:${isItalic ? 'italic' : 'normal'};${f(t.font)}">${esc(c.message)}</p></div>`
  return card(t, c.cardRadius, content)
}

// ─── Section: Progress ────────────────────────────────────────────────────────

function renderProgressSection(s, t, c, stepIdx) {
  const labels = c.progressLabels || DEFAULT_PROGRESS_LABELS
  const content = sectionHead(s.heading, t) + renderProgress(t, stepIdx, labels)
  return card(t, c.cardRadius, content)
}

// ─── Section: Details ────────────────────────────────────────────────────────

function renderDetails(s, t, c, d) {
  const rows = [['Deceased', d.deceased], ['Date', d.date], ['Package', d.package]].map(([l, v]) =>
    `<div style="margin-bottom:8px"><div style="font-size:10px;color:${t.muted};${f(t.font)}">${l}</div><div style="font-size:${c.fontSize - 1}px;color:${t.text};font-weight:500;margin-top:2px;${f(t.font)}">${esc(v)}</div></div>`
  ).join('')
  return card(t, c.cardRadius, sectionHead(s.heading, t) + rows)
}

// ─── Section: Documents ──────────────────────────────────────────────────────
// Accepts documents as strings OR {name, url} objects.
// When a URL is present the PDF icon + filename + "View" become a clickable link.

function renderDocuments(s, t, c, d) {
  if (!d.documents || d.documents.length === 0) return ''
  const cr = Math.min(c.cardRadius, 6)
  const rows = d.documents.map(doc => {
    const name = typeof doc === 'string' ? doc : (doc.name || 'Document')
    const url  = typeof doc === 'object' ? (doc.url || null) : null

    const icon = `<div style="width:28px;height:32px;border-radius:4px;background-color:${t.accent}22"><table cellpadding="0" cellspacing="0" width="28" height="32" style="border-collapse:collapse"><tr><td align="center" valign="middle" style="font-size:8px;font-weight:700;color:${t.accent};${f(t.font)}">PDF</td></tr></table></div>`
    const viewLabel = url
      ? `<a href="${esc(url)}" style="font-size:${c.fontSize - 2}px;color:${t.accent};font-weight:600;text-decoration:none;white-space:nowrap;${f(t.font)}">View →</a>`
      : ''
    const row = `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:6px">
  <tr>
    <td valign="middle" width="38">${url ? `<a href="${esc(url)}" style="text-decoration:none">${icon}</a>` : icon}</td>
    <td valign="middle" style="padding-left:10px"><div style="font-size:${c.fontSize - 1}px;color:${t.text};${f(t.font)}">${url ? `<a href="${esc(url)}" style="color:${t.text};text-decoration:none;${f(t.font)}">${esc(name)}</a>` : esc(name)}</div></td>
    ${viewLabel ? `<td valign="middle" align="right" style="white-space:nowrap">${viewLabel}</td>` : ''}
  </tr>
</table>`
    return `<div style="background-color:${t.bg};border-radius:${cr}px;padding:4px 8px;margin-bottom:4px">${row}</div>`
  }).join('')
  return card(t, c.cardRadius, sectionHead(s.heading, t) + rows)
}

// ─── Section: Coordinator ────────────────────────────────────────────────────

function renderCoordinator(s, t, c, d) {
  const ini = initials(d.coordinator)
  const content = sectionHead(s.heading, t) + `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
  <tr>
    <td valign="middle" width="46">
      <div style="width:36px;height:36px;border-radius:50%;background-color:${t.accent}33"><table cellpadding="0" cellspacing="0" width="36" height="36" style="border-collapse:collapse"><tr><td align="center" valign="middle" style="font-size:13px;color:${t.accent};font-weight:600;${f(t.font)}">${esc(ini)}</td></tr></table></div>
    </td>
    <td valign="middle" style="padding-left:10px">
      <div style="font-size:${c.fontSize}px;color:${t.text};font-weight:600;${f(t.font)}">${esc(d.coordinator)}</div>
      <div style="font-size:${c.fontSize - 2}px;color:${t.muted};margin-top:2px;${f(t.font)}">${esc(d.coordinatorPhone)}</div>
    </td>
    <td valign="middle" align="right">
      <div style="display:inline-block;background-color:${t.accent};color:#fff;border-radius:${c.buttonRadius}px;padding:7px 16px;font-size:${c.fontSize - 1}px;font-weight:500;${f(t.font)}">${esc(c.buttonLabel)}</div>
    </td>
  </tr>
</table>`
  return card(t, c.cardRadius, content)
}

// ─── Section dispatcher ───────────────────────────────────────────────────────

function renderSection(s, t, c, d, stepIdx) {
  switch (s.id) {
    case 'message':     return renderMessage(s, t, c)
    case 'progress':    return renderProgressSection(s, t, c, stepIdx)
    case 'details':     return renderDetails(s, t, c, d)
    case 'documents':   return renderDocuments(s, t, c, d)
    case 'coordinator': return renderCoordinator(s, t, c, d)
    default: return ''
  }
}

// ─── Header: Classic (centered logo, name, tagline + accent divider) ──────────

function headerClassic(t, c, logoUrl) {
  return `<tr><td align="center" style="background-color:${t.headerBg};padding:28px 40px;border-radius:8px 8px 0 0">
  <div style="margin-bottom:10px;text-align:center">${logoImg(logoUrl, t, 44, 'circle')}</div>
  <div style="color:${t.headerText};font-size:18px;font-weight:400;letter-spacing:0.04em;margin-bottom:4px;${f(t.font)}">${esc(c.footerName)}</div>
  <div style="color:${t.headerText}80;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;${f(t.font)}">${esc(c.footerTagline)}</div>
</td></tr>
<tr><td style="height:3px;background-color:${t.accent};font-size:0;line-height:0">&nbsp;</td></tr>`
}

// ─── Header: Minimal (logo+name left, "Case Update" right) ───────────────────

function headerMinimal(t, c, logoUrl) {
  return `<tr><td style="background-color:${t.headerBg};padding:22px 36px;border-radius:8px 8px 0 0">
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
    <td valign="middle">${logoImg(logoUrl, t, 32, 'square')}</td>
    <td valign="middle" style="padding-left:10px"><span style="color:${t.headerText};font-weight:700;font-size:15px;letter-spacing:-0.01em;${f(t.font)}">${esc(c.footerName)}</span></td>
    <td valign="middle" align="right"><span style="color:${t.headerText}60;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;${f(t.font)}">Case Update</span></td>
  </tr></table>
</td></tr>`
}

// ─── Header: Ember (logo+name+family greeting in warm header) ─────────────────

function headerEmber(t, c, logoUrl, d) {
  return `<tr><td style="background-color:${t.headerBg};padding:30px 40px;border-radius:8px 8px 0 0">
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:20px"><tr>
    <td valign="middle" width="48">${logoImg(logoUrl, t, 36, 'rounded')}</td>
    <td valign="middle" style="padding-left:12px">
      <div style="color:${t.headerText};font-weight:600;font-size:16px;${f(t.font)}">${esc(c.footerName)}</div>
      <div style="color:${t.headerText}99;font-size:11px;margin-top:2px;${f(t.font)}">${esc(c.footerTagline)}</div>
    </td>
  </tr></table>
  <div style="color:${t.headerText};font-size:24px;font-weight:400;line-height:1.3;margin-bottom:6px;${f(t.font)}">${esc(c.greeting || d.family)}</div>
  <div style="color:${t.headerText}B3;font-size:13px;${f(t.font)}">Caring for ${esc(d.deceased)} · ${esc(d.package)}</div>
</td></tr>`
}

// ─── Header: Dusk (dark, logo+name left, "Case Update" right, bottom border) ──

function headerDusk(t, c, logoUrl) {
  return `<tr><td style="background-color:${t.headerBg};padding:28px 36px;border-bottom:1px solid ${t.border};border-radius:8px 8px 0 0">
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
    <td valign="middle">${logoImg(logoUrl, t, 36, 'rounded')}</td>
    <td valign="middle" style="padding-left:10px">
      <div style="color:${t.headerText};font-weight:400;font-size:15px;letter-spacing:0.04em;${f(t.font)}">${esc(c.footerName)}</div>
    </td>
    <td valign="middle" align="right"><div style="color:${t.muted};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;${f(t.font)}">Case Update</div></td>
  </tr></table>
</td></tr>`
}

// ─── Header: Garden (green, logo+name+tagline left) ──────────────────────────

function headerGarden(t, c, logoUrl) {
  return `<tr><td style="background-color:${t.headerBg};padding:24px 36px;border-radius:8px 8px 0 0">
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
    <td valign="middle" width="56">${logoImg(logoUrl, t, 42, 'rounded')}</td>
    <td valign="middle" style="padding-left:14px">
      <div style="color:${t.headerText};font-weight:600;font-size:16px;${f(t.font)}">${esc(c.footerName)}</div>
      <div style="color:${t.headerText}B3;font-size:11px;margin-top:2px;${f(t.font)}">${esc(c.footerTagline)}</div>
    </td>
  </tr></table>
</td></tr>`
}

// ─── Header: Pearl (muted purple, logo+name+tagline) ─────────────────────────

function headerPearl(t, c, logoUrl) {
  return `<tr><td style="background-color:${t.headerBg};padding:24px 36px;border-radius:8px 8px 0 0">
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
    <td valign="middle" width="50">${logoImg(logoUrl, t, 38, 'circle')}</td>
    <td valign="middle" style="padding-left:12px">
      <div style="color:${t.headerText};font-weight:600;font-size:15px;${f(t.font)}">${esc(c.footerName)}</div>
      <div style="color:${t.headerText}A6;font-size:11px;margin-top:2px;${f(t.font)}">${esc(c.footerTagline)}</div>
    </td>
  </tr></table>
</td></tr>`
}

// ─── Header dispatcher ────────────────────────────────────────────────────────

function renderHeader(t, c, logoUrl, d) {
  switch (t.layout) {
    case 'classic': return headerClassic(t, c, logoUrl)
    case 'minimal': return headerMinimal(t, c, logoUrl)
    case 'ember':   return headerEmber(t, c, logoUrl, d)
    case 'dusk':    return headerDusk(t, c, logoUrl)
    case 'garden':  return headerGarden(t, c, logoUrl)
    case 'pearl':   return headerPearl(t, c, logoUrl)
    default:        return headerClassic(t, c, logoUrl)
  }
}

// ─── Greeting block ───────────────────────────────────────────────────────────

function renderGreeting(t, c, d) {
  const isClassic = t.layout === 'classic'
  const isEmber   = t.layout === 'ember'
  // Ember bakes greeting into header — skip body greeting
  if (isEmber) return ''

  const align = isClassic ? 'center' : 'left'
  const displayName = c.greeting || (t.layout === 'garden' ? `Dear ${d.family},` : d.family)
  const sub = isClassic     ? `In memory of ${esc(d.deceased)}`
            : t.layout === 'dusk'   ? `Regarding the care of ${esc(d.deceased)}`
            : t.layout === 'pearl'  ? `In care of ${esc(d.deceased)} · ${esc(d.package)}`
            : `Case for ${esc(d.deceased)} · ${esc(d.package)}`

  const familyColor = t.layout === 'dusk' ? t.accent : c.headingColor
  const familyWeight = t.font.includes('serif') ? 400 : 600
  const divider = isClassic
    ? `<div style="height:1px;background-color:${t.border || '#E0E0E0'};margin:20px 0;font-size:0;line-height:0">&nbsp;</div>`
    : t.layout === 'dusk'
    ? `<div style="width:48px;height:1px;background-color:${t.accent};margin-top:16px;margin-bottom:0;font-size:0;line-height:0">&nbsp;</div>`
    : ''

  return `<div style="text-align:${align};margin-bottom:20px">
  <div style="font-size:${c.headingSize}px;color:${familyColor};font-weight:${familyWeight};line-height:1.3;margin-bottom:6px;${f(t.font)}">${esc(displayName)}</div>
  <div style="font-size:${c.fontSize - 1}px;color:${t.muted};${f(t.font)}">${sub}</div>
  ${divider}
</div>`
}

// ─── Footer dispatcher ────────────────────────────────────────────────────────

function renderFooter(t, c) {
  if (t.layout === 'minimal' || t.layout === 'dusk') {
    return `<tr><td style="background-color:${t.footerBg};padding:18px 36px;border-top:${t.layout === 'dusk' ? `1px solid ${t.border}` : 'none'};border-radius:0 0 8px 8px">
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
    <td style="font-size:13px;font-weight:${t.layout === 'minimal' ? 700 : 400};color:${t.footerText};letter-spacing:${t.layout === 'dusk' ? '0.04em' : '0'};${f(t.font)}">${esc(c.footerName)}</td>
    <td align="right" style="font-size:11px;color:${t.footerText};opacity:0.6;${f(t.font)}">${esc(c.footerCopyright)}</td>
  </tr></table>
</td></tr>`
  }
  return `<tr><td align="center" style="background-color:${t.footerBg};padding:20px 36px;border-radius:0 0 8px 8px">
  <div style="color:${t.footerText};font-size:13px;font-weight:600;margin-bottom:6px;${f(t.font)}">${esc(c.footerName)}</div>
  <div style="color:${t.footerText};font-size:12px;opacity:0.75;line-height:1.5;${f(t.font)}">${esc(c.footerAddress)}</div>
  <div style="color:${t.footerText};font-size:11px;opacity:0.55;margin-top:10px;${f(t.font)}">${esc(c.footerCopyright)}</div>
</td></tr>`
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateEmailHtml(template, sections, config, caseData, logoUrl) {
  const t = template
  const c = config
  const d = { ...SAMPLE, ...caseData }
  const stepIdx = Math.max(0, STATUS_ORDER.indexOf(d.status))
  const enabled  = (sections || DEFAULT_SECTIONS).filter(s => s.enabled)
  const bodyPad  = BODY_PADDING[t.layout] || '28px 36px'

  // Ember bakes the greeting into its header, so we skip the body greeting
  const sectionsHtml = enabled.map(s => renderSection(s, t, c, d, stepIdx)).join('\n')

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${esc(c.footerName)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#e0e0e0">
<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#e0e0e0">
<tr><td align="center" style="padding:24px 12px">
<table cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;max-width:600px;width:100%">

${renderHeader(t, c, logoUrl, d)}

<tr><td style="background-color:${t.bg};padding:${bodyPad}">
  ${renderGreeting(t, c, d)}
  ${sectionsHtml}
</td></tr>

${renderFooter(t, c)}

</table>
</td></tr>
</table>
</body>
</html>`
}
