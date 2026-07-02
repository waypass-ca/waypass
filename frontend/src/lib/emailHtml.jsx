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

// ─── Email-safe section renderers (table-based, no flexbox/grid) ─────────────

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function card(t, cr, content) {
  const border = t.layout === 'pearl'
    ? `border-top:4px solid ${t.accent};border:1px solid ${t.border || '#E0E0E0'};border-top:4px solid ${t.accent}`
    : `border:1px solid ${t.border || '#E0E0E0'}`
  return `<div style="background-color:${t.cardBg};border-radius:${cr}px;${border};padding:18px 22px;margin-bottom:14px">${content}</div>`
}

function sectionHeading(text, t) {
  if (!text) return ''
  return `<div style="font-size:10px;color:${t.muted};font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;font-family:${t.font}">${esc(text)}</div>`
}

function renderProgress(t, stepIdx, labels) {
  const steps = labels.map((label, i) => ({ label, done: i <= stepIdx, active: i === stepIdx }))
  const dotSize = 24
  const lineColor = (i) => i < stepIdx ? t.progressActive : (t.border || '#E0E0E0')
  const dotBg = (s) => s.done ? t.progressActive : 'transparent'
  const dotBorder = (s) => s.done ? t.progressActive : (t.border || '#E0E0E0')

  // Build columns: [dot_col, line_col, dot_col, line_col, ...]
  let cols = ''
  steps.forEach((s, i) => {
    const checkmark = s.done && !s.active
      ? `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E" width="10" height="10" alt="" />`
      : ''
    const innerDot = s.active
      ? `<div style="width:7px;height:7px;border-radius:50%;background-color:white;margin:auto"></div>`
      : checkmark

    cols += `<td align="center" valign="top" style="width:${Math.round(100 / steps.length)}%">
      <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;border:2px solid ${dotBorder(s)};background-color:${dotBg(s)};margin:0 auto;display:table;table-layout:fixed">
        <div style="display:table-cell;vertical-align:middle;text-align:center">${innerDot}</div>
      </div>
      <div style="font-size:10px;color:${s.done ? t.text : t.muted};margin-top:6px;text-align:center;line-height:1.3;font-family:${t.font}">${esc(s.label)}</div>
    </td>`

    if (i < steps.length - 1) {
      cols += `<td valign="top" style="padding-top:${dotSize / 2 - 1}px">
        <div style="height:2px;background-color:${lineColor(i)};font-size:0;line-height:0">&nbsp;</div>
      </td>`
    }
  })

  return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>${cols}</tr></table>`
}

function renderProgressBar(t, stepIdx, labels) {
  const pct = Math.round(((stepIdx + 1) / labels.length) * 100)
  const current = labels[stepIdx] || ''
  const labelCols = labels.map((l, i) => `<td align="${i === 0 ? 'left' : i === labels.length - 1 ? 'right' : 'center'}" style="font-size:9px;color:${i <= stepIdx ? t.progressActive : t.muted};font-weight:${i <= stepIdx ? 600 : 400};font-family:${t.font}">${esc(l)}</td>`).join('')
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:8px">
      <tr>
        <td style="font-size:12px;color:${t.text};font-weight:600;font-family:${t.font}">${esc(current)}</td>
        <td align="right" style="font-size:11px;color:${t.accent};font-weight:700;font-family:${t.font}">${pct}%</td>
      </tr>
    </table>
    <div style="height:6px;border-radius:99px;background-color:${t.border || '#E8E0D8'};overflow:hidden">
      <div style="height:6px;width:${pct}%;background-color:${t.progressActive};border-radius:99px"></div>
    </div>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-top:8px">
      <tr>${labelCols}</tr>
    </table>`
}

function renderProgressPills(t, stepIdx, labels) {
  const cols = labels.map((l, i) => {
    const done = i <= stepIdx
    return `<td style="padding:0 3px">
      <div style="background-color:${done ? t.progressActive : (t.border || '#E8E0D8')};border-radius:8px;padding:8px 4px;text-align:center">
        <div style="font-size:9px;color:${done ? '#ffffff' : t.muted};font-weight:600;line-height:1.3;font-family:${t.font}">${esc(l)}</div>
      </div>
    </td>`
  }).join('')
  return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>${cols}</tr></table>`
}

function renderProgressTimeline(t, stepIdx, labels) {
  return labels.map((l, i) => {
    const done = i <= stepIdx
    const active = i === stepIdx
    const checkmark = done && !active
      ? `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E" width="9" height="9" alt="" />`
      : ''
    const innerDot = active
      ? `<div style="width:6px;height:6px;border-radius:50%;background-color:${t.progressActive};margin:auto"></div>`
      : checkmark
    return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:${i < labels.length - 1 ? '4' : '0'}px">
      <tr>
        <td valign="top" style="width:20px">
          <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${done ? t.progressActive : (t.border || '#E0E0E0')};background-color:${done ? t.progressActive : 'transparent'};display:table;table-layout:fixed">
            <div style="display:table-cell;vertical-align:middle;text-align:center">${innerDot}</div>
          </div>
        </td>
        <td style="padding-left:12px;padding-top:2px;font-size:12px;color:${done ? t.text : t.muted};font-weight:${done ? 600 : 400};line-height:1.3;font-family:${t.font}">${esc(l)}</td>
      </tr>
    </table>`
  }).join('')
}

function renderDocuments(t, c, cr, docs) {
  if (!docs || docs.length === 0) return ''
  const rows = docs.map(doc => `
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:6px">
      <tr>
        <td valign="middle" style="width:36px">
          <div style="width:26px;height:30px;border-radius:4px;background-color:${t.accent}33;text-align:center;display:table;table-layout:fixed">
            <div style="display:table-cell;vertical-align:middle;font-size:8px;font-weight:700;color:${t.accent};font-family:${t.font}">PDF</div>
          </div>
        </td>
        <td style="padding-left:10px;font-size:${c.fontSize - 1}px;color:${t.text};font-family:${t.font}">${esc(doc)}</td>
      </tr>
    </table>`
  ).join('')
  return `<div style="background-color:${t.bg};border-radius:${Math.min(cr, 6)}px;padding:4px 0">${rows}</div>`
}

function renderCoordinator(t, c, d) {
  const initials = (d.coordinator || 'SM').split(' ').map(n => n[0]).join('')
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
      <tr>
        <td valign="middle" style="width:46px">
          <div style="width:36px;height:36px;border-radius:50%;background-color:${t.accent}33;display:table;table-layout:fixed">
            <div style="display:table-cell;vertical-align:middle;text-align:center;font-size:13px;color:${t.accent};font-weight:600;font-family:${t.font}">${esc(initials)}</div>
          </div>
        </td>
        <td valign="middle" style="padding-left:10px">
          <div style="font-size:${c.fontSize}px;color:${t.text};font-weight:600;font-family:${t.font}">${esc(d.coordinator)}</div>
          <div style="font-size:${c.fontSize - 2}px;color:${t.muted};margin-top:2px;font-family:${t.font}">${esc(d.coordinatorPhone)}</div>
        </td>
        <td valign="middle" align="right" style="white-space:nowrap">
          <div style="display:inline-block;background-color:${t.accent};color:#ffffff;border-radius:${c.buttonRadius}px;padding:7px 16px;font-size:${c.fontSize - 1}px;font-weight:500;font-family:${t.font}">${esc(c.buttonLabel)}</div>
        </td>
      </tr>
    </table>`
}

function renderSection(s, t, c, d, cr, variant) {
  const PROGRESS_VARIANT = {
    classic: 'dots', minimal: 'bar', ember: 'bar',
    dusk: 'pills', garden: 'timeline', pearl: 'pills',
  }
  const v = PROGRESS_VARIANT[t.layout] || 'dots'
  const stepIdx = STATUS_ORDER.indexOf(d.status)
  const labels = c.progressLabels || DEFAULT_PROGRESS_LABELS

  let inner = ''
  switch (s.id) {
    case 'message':
      inner = `<p style="font-size:${c.fontSize}px;color:${t.text}CC;line-height:1.8;margin:0;font-style:${t.layout === 'classic' ? 'italic' : 'normal'};font-family:${t.font}">${esc(c.message || d.message)}</p>`
      break
    case 'progress':
      inner = sectionHeading(s.heading, t) + (
        v === 'bar'      ? renderProgressBar(t, stepIdx, labels) :
        v === 'pills'    ? renderProgressPills(t, stepIdx, labels) :
        v === 'timeline' ? renderProgressTimeline(t, stepIdx, labels) :
                           renderProgress(t, stepIdx, labels)
      )
      break
    case 'details':
      inner = sectionHeading(s.heading, t) + [['Deceased', d.deceased], ['Date', d.date], ['Package', d.package]].map(([l, v]) =>
        `<div style="margin-bottom:8px"><div style="font-size:10px;color:${t.muted};font-family:${t.font}">${l}</div><div style="font-size:${c.fontSize - 1}px;color:${t.text};font-weight:500;margin-top:2px;font-family:${t.font}">${esc(v)}</div></div>`
      ).join('')
      break
    case 'documents':
      inner = sectionHeading(s.heading, t) + renderDocuments(t, c, cr, d.documents)
      break
    case 'coordinator':
      inner = sectionHeading(s.heading, t) + renderCoordinator(t, c, d)
      break
    default: return ''
  }

  const borderLeft = s.id === 'message' && t.layout !== 'pearl' && t.layout !== 'minimal'
    ? `border-left:3px solid ${t.accent};` : ''
  return card(t, cr, `<div style="${borderLeft}${borderLeft ? 'padding-left:14px;' : ''}">${inner}</div>`)
}

function renderLogo(logoUrl, t) {
  if (logoUrl) {
    return `<img src="${esc(logoUrl)}" alt="Logo" width="44" height="44" style="height:44px;max-width:120px;object-fit:contain;border-radius:4px;display:block" />`
  }
  return `<div style="width:44px;height:44px;border-radius:50%;background-color:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3);display:table;table-layout:fixed">
    <div style="display:table-cell;vertical-align:middle;text-align:center;font-size:13px;font-weight:700;color:${t.headerText || '#ffffff'};font-family:${t.font}">EG</div>
  </div>`
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateEmailHtml(template, sections, config, caseData, logoUrl) {
  const t = template
  const c = config
  const d = { ...SAMPLE, ...caseData }
  const cr = c.cardRadius ?? 10
  const enabled = (sections || DEFAULT_SECTIONS).filter(s => s.enabled)

  const isClassic = t.layout === 'classic'
  const headerPad = isClassic ? '28px 40px' : '22px 36px'
  const bodyPad = isClassic ? '32px 48px' : '28px 36px'

  // Header
  const headerInner = isClassic
    ? `<div style="margin-bottom:10px;text-align:center">${renderLogo(logoUrl, t)}</div>
       <div style="color:${t.headerText};font-size:18px;font-weight:400;letter-spacing:0.04em;margin-bottom:4px;font-family:${t.font}">${esc(c.footerName)}</div>
       <div style="color:${t.headerText}80;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-family:${t.font}">${esc(c.footerTagline)}</div>`
    : `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
         <tr>
           <td valign="middle" style="width:54px">${renderLogo(logoUrl, t)}</td>
           <td valign="middle" style="padding-left:10px">
             <div style="color:${t.headerText};font-weight:600;font-size:15px;font-family:${t.font}">${esc(c.footerName)}</div>
             <div style="color:${t.headerText}80;font-size:11px;margin-top:2px;font-family:${t.font}">${esc(c.footerTagline)}</div>
           </td>
         </tr>
       </table>`

  // Greeting block
  const greetingAlign = isClassic ? 'center' : 'left'
  const greetingInner = `
    <div style="font-size:${c.headingSize}px;color:${t.layout === 'dusk' ? t.accent : c.headingColor};font-weight:${t.font.includes('serif') ? 400 : 600};line-height:1.3;margin-bottom:6px;font-family:${t.font}">${esc(c.greeting || d.family)}</div>
    <div style="font-size:${c.fontSize - 1}px;color:${t.muted};font-family:${t.font}">${isClassic ? `In memory of ${esc(d.deceased)}` : `Case for ${esc(d.deceased)} · ${esc(d.package)}`}</div>
    ${t.layout === 'dusk' ? `<div style="width:48px;height:1px;background-color:${t.accent};margin-top:16px"></div>` : ''}
    ${isClassic ? `<div style="border-top:1px solid ${t.border || '#E0E0E0'};margin:20px 0"></div>` : ''}`

  const sections_html = enabled.map(s => renderSection(s, t, c, d, cr)).join('')

  const body = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${esc(c.footerName)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0">
<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#f0f0f0">
<tr><td align="center" style="padding:24px 12px">
<table cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;max-width:600px;width:100%">

<!-- Header -->
<tr><td style="background-color:${t.headerBg};padding:${headerPad};text-align:${greetingAlign};border-radius:8px 8px 0 0">
  ${headerInner}
</td></tr>
${isClassic ? `<tr><td style="height:3px;background-color:${t.accent};font-size:0;line-height:0">&nbsp;</td></tr>` : ''}

<!-- Body -->
<tr><td style="background-color:${t.bg};padding:${bodyPad}">
  <div style="text-align:${greetingAlign};margin-bottom:20px">${greetingInner}</div>
  ${sections_html}
</td></tr>

<!-- Footer -->
<tr><td style="background-color:${t.footerBg};padding:20px 36px;text-align:center;border-radius:0 0 8px 8px">
  <div style="color:${t.footerText};font-size:13px;font-weight:600;margin-bottom:6px;font-family:${t.font}">${esc(c.footerName)}</div>
  <div style="color:${t.footerText};font-size:12px;opacity:0.75;line-height:1.5;font-family:${t.font}">${esc(c.footerAddress)}</div>
  <div style="color:${t.footerText};font-size:11px;opacity:0.55;margin-top:10px;font-family:${t.font}">${esc(c.footerCopyright)}</div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return body
}
