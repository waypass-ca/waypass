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

export function buildEmailConfig(customizations, template, funeralHomeName = '') {
  const c = customizations ?? {}
  const homeName = c.footerName || funeralHomeName || SAMPLE.funeralHome
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
    footerName:      homeName,
    footerTagline:   c.footerTagline   ?? SAMPLE.tagline,
    footerAddress:   c.footerAddress   ?? '123 Memorial Lane · San Francisco · (415) 555-0100',
    footerCopyright: c.footerCopyright ?? `© ${new Date().getFullYear()} ${homeName} · Unsubscribe`,
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const CHECK_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E`
const CHECK_SVG_SM = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E`

function logo(logoUrl, t, size = 44, shape = 'rounded', centered = false) {
  const margin = centered ? 'display:block;margin:0 auto' : 'display:block'
  if (logoUrl) {
    const r = shape === 'circle' ? '50%' : '4px'
    return `<img src="${esc(logoUrl)}" alt="" width="${size}" height="${size}" style="${margin};width:${size}px;height:${size}px;object-fit:contain;border-radius:${r}" />`
  }
  const r = shape === 'circle' ? '50%' : '8px'
  return `<div style="width:${size}px;height:${size}px;border-radius:${r};background-color:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.3);${centered ? 'margin:0 auto' : ''}"><table cellpadding="0" cellspacing="0" width="${size}" height="${size}" style="border-collapse:collapse"><tr><td align="center" valign="middle" style="font-size:13px;font-weight:700;color:${t.headerText || '#fff'};font-family:${t.font}">EG</td></tr></table></div>`
}

function hr(color, margin = '20px 0') {
  return `<div style="height:1px;background-color:${color};margin:${margin};font-size:0;line-height:0">&nbsp;</div>`
}

function initials(name, fallback = 'SM') {
  if (!name) return fallback
  return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Progress renderers (email-safe, table-based) ─────────────────────────────

function progressDots(t, stepIdx, labels) {
  const n = labels.length
  const tds = labels.map((label, i) => {
    const done = i <= stepIdx
    const bg = done ? t.progressActive : (t.cardBg || '#FFFFFF')
    const border = done ? t.progressActive : '#D0D0D0'
    const textColor = done ? t.text : t.muted
    const inner = done
      ? `<div style="width:7px;height:7px;border-radius:50%;background-color:white;margin:0 auto"></div>`
      : ''
    const lineColor = i < stepIdx ? t.progressActive : '#D0D0D0'
    return [
      `<td align="center" valign="top">`,
      `  <div style="width:24px;height:24px;border-radius:50%;border:2px solid ${border};background-color:${bg};margin:0 auto">`,
      `    <table cellpadding="0" cellspacing="0" width="24" height="24" style="border-collapse:collapse">`,
      `      <tr><td align="center" valign="middle">${inner}</td></tr>`,
      `    </table>`,
      `  </div>`,
      `  <div style="font-size:10px;color:${textColor};margin-top:6px;text-align:center;line-height:1.3;font-family:${t.font}">${esc(label)}</div>`,
      `</td>`,
      i < n - 1 ? `<td valign="top" style="padding-top:11px"><div style="height:2px;background-color:${lineColor};font-size:0;line-height:0">&nbsp;</div></td>` : '',
    ].join('\n')
  }).join('\n')
  return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>${tds}</tr></table>`
}

function progressBar(t, stepIdx, labels) {
  const pct = Math.round(((stepIdx + 1) / labels.length) * 100)
  const current = esc(labels[stepIdx] || '')
  const labelTds = labels.map((l, i) => {
    const align = i === 0 ? 'left' : i === labels.length - 1 ? 'right' : 'center'
    return `<td align="${align}" style="font-size:9px;color:${i <= stepIdx ? t.progressActive : t.muted};font-weight:${i <= stepIdx ? 600 : 400};font-family:${t.font}">${esc(l)}</td>`
  }).join('')
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:8px"><tr>
      <td style="font-size:12px;color:${t.text};font-weight:600;font-family:${t.font}">${current}</td>
      <td align="right" style="font-size:11px;color:${t.accent};font-weight:700;font-family:${t.font}">${pct}%</td>
    </tr></table>
    <div style="height:6px;border-radius:99px;background-color:${t.border || '#E8E0D8'};overflow:hidden;margin-bottom:8px">
      <div style="height:6px;width:${pct}%;background-color:${t.progressActive};border-radius:99px"></div>
    </div>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>${labelTds}</tr></table>`
}

function progressPills(t, stepIdx, labels) {
  const tds = labels.map((l, i) => {
    const done = i <= stepIdx
    return `<td style="padding:0 3px"><div style="background-color:${done ? t.progressActive : (t.border || '#E8E0D8')};border-radius:8px;padding:8px 4px;text-align:center"><div style="font-size:9px;color:${done ? '#fff' : t.muted};font-weight:600;line-height:1.3;font-family:${t.font}">${esc(l)}</div></div></td>`
  }).join('')
  return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>${tds}</tr></table>`
}

function progressTimeline(t, stepIdx, labels) {
  return labels.map((l, i) => {
    const done = i <= stepIdx
    const active = i === stepIdx
    const border = done ? t.progressActive : (t.border || '#E0E0E0')
    const bg = done ? t.progressActive : 'transparent'
    const inner = (done && !active)
      ? `<img src="${CHECK_SVG_SM}" width="9" height="9" alt="" style="display:block;margin:0 auto" />`
      : active
      ? `<div style="width:6px;height:6px;border-radius:50%;background-color:${t.progressActive};margin:0 auto"></div>`
      : ''
    const connector = i < labels.length - 1
      ? `<div style="width:2px;height:20px;background-color:${i < stepIdx ? t.progressActive : (t.border || '#E0E0E0')};margin:2px auto 0"></div>`
      : ''
    return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
      <td valign="top" width="20">
        <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${border};background-color:${bg}">
          <table cellpadding="0" cellspacing="0" width="20" height="20" style="border-collapse:collapse"><tr><td align="center" valign="middle">${inner}</td></tr></table>
        </div>
        ${connector}
      </td>
      <td style="padding-left:12px;padding-top:2px">
        <div style="font-size:12px;color:${done ? t.text : t.muted};font-weight:${done ? 600 : 400};line-height:1.3;font-family:${t.font}">${esc(l)}</div>
      </td>
    </tr></table>`
  }).join('')
}

// ─── Section content renderers ────────────────────────────────────────────────

function sectionProgress(t, stepIdx, labels, layout) {
  const VARIANT = { classic:'dots', minimal:'bar', ember:'bar', dusk:'pills', garden:'timeline', pearl:'pills' }
  const v = VARIANT[layout] || 'dots'
  if (v === 'bar')      return progressBar(t, stepIdx, labels)
  if (v === 'pills')    return progressPills(t, stepIdx, labels)
  if (v === 'timeline') return progressTimeline(t, stepIdx, labels)
  return progressDots(t, stepIdx, labels)
}

function sectionDetails(t, c, d) {
  return [['Deceased', d.deceased], ['Date', d.date], ['Package', d.package]].map(([l, v]) =>
    `<div style="margin-bottom:8px">
       <div style="font-size:10px;color:${t.muted};font-family:${t.font}">${l}</div>
       <div style="font-size:${c.fontSize - 1}px;color:${t.text};font-weight:500;margin-top:2px;font-family:${t.font}">${esc(v)}</div>
     </div>`
  ).join('')
}

// Documents are sent as email attachments — just show the filenames in the email body.
function sectionDocuments(t, c, d) {
  if (!d.documents || d.documents.length === 0) return ''
  return d.documents.map(doc => {
    const name = typeof doc === 'string' ? doc : (doc?.name || 'Document')
    return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:6px"><tr>
       <td valign="middle" width="36">
         <div style="width:26px;height:30px;border-radius:4px;background-color:${t.accent}33">
           <table cellpadding="0" cellspacing="0" width="26" height="30" style="border-collapse:collapse">
             <tr><td align="center" valign="middle" style="font-size:8px;font-weight:700;color:${t.accent};font-family:${t.font}">PDF</td></tr>
           </table>
         </div>
       </td>
       <td style="padding-left:10px"><span style="font-size:${c.fontSize - 1}px;color:${t.text};font-family:${t.font}">${esc(name)}</span></td>
       <td align="right" valign="middle" style="padding-left:8px;white-space:nowrap"><span style="font-size:${c.fontSize - 2}px;color:${t.muted};font-family:${t.font}">Attached</span></td>
     </tr></table>`
  }).join('')
}

function sectionCoordinator(t, c, d) {
  const ini = initials(d.coordinator)
  // Use tel: link when a phone number is available so the button is tappable in email
  const phone = d.coordinatorPhone || ''
  const href = phone ? `tel:${phone.replace(/\s/g, '')}` : '#'
  return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
    <td valign="middle" width="46">
      <div style="width:36px;height:36px;border-radius:50%;background-color:${t.accent}33">
        <table cellpadding="0" cellspacing="0" width="36" height="36" style="border-collapse:collapse">
          <tr><td align="center" valign="middle" style="font-size:13px;color:${t.accent};font-weight:600;font-family:${t.font}">${esc(ini)}</td></tr>
        </table>
      </div>
    </td>
    <td valign="middle" style="padding-left:10px">
      <div style="font-size:${c.fontSize}px;color:${t.text};font-weight:600;font-family:${t.font}">${esc(d.coordinator)}</div>
      <div style="font-size:${c.fontSize - 2}px;color:${t.muted};margin-top:2px;font-family:${t.font}">${esc(phone)}</div>
    </td>
    <td valign="middle" align="right">
      <a href="${esc(href)}" style="display:inline-block;background-color:${t.accent};color:#ffffff;border-radius:${c.buttonRadius}px;padding:7px 16px;font-size:${c.fontSize - 1}px;font-weight:500;text-decoration:none;font-family:${t.font}">${esc(c.buttonLabel)}</a>
    </td>
  </tr></table>`
}

// ─── Card wrapper per template ────────────────────────────────────────────────

function card(t, cr, content, extraStyle = '') {
  let style
  if (t.layout === 'minimal') {
    style = `background-color:${t.cardBg};border-radius:${cr}px;padding:18px 22px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,0.07)`
  } else if (t.layout === 'pearl') {
    style = `background-color:${t.cardBg};border-radius:${cr}px;border-top:4px solid ${t.accent};border-left:1px solid ${t.border || '#E0E0E0'};border-right:1px solid ${t.border || '#E0E0E0'};border-bottom:1px solid ${t.border || '#E0E0E0'};padding:18px 22px;margin-bottom:14px`
  } else {
    style = `background-color:${t.cardBg};border-radius:${cr}px;border:1px solid ${t.border || '#E0E0E0'};padding:18px 22px;margin-bottom:14px`
  }
  return `<div style="${style}${extraStyle ? ';' + extraStyle : ''}">${content}</div>`
}

function heading(text, t) {
  return text
    ? `<div style="font-size:10px;color:${t.muted};font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;font-family:${t.font}">${esc(text)}</div>`
    : ''
}

// ─── Section dispatcher ───────────────────────────────────────────────────────

function renderSection(s, t, c, d, stepIdx) {
  const cr = c.cardRadius ?? 10
  const labels = c.progressLabels || DEFAULT_PROGRESS_LABELS

  switch (s.id) {
    case 'message': {
      const borderLeft = (t.layout !== 'pearl' && t.layout !== 'minimal')
        ? `border-left:3px solid ${t.accent};padding-left:14px` : ''
      const content = `<div style="${borderLeft}"><p style="font-size:${c.fontSize}px;color:${t.text}CC;line-height:1.8;margin:0;font-style:${t.layout === 'classic' ? 'italic' : 'normal'};font-family:${t.font}">${esc(c.message || d.message)}</p></div>`
      return card(t, cr, content)
    }
    case 'progress': {
      const content = heading(s.heading, t) + sectionProgress(t, stepIdx, labels, t.layout)
      return card(t, cr, content)
    }
    case 'details': {
      const content = heading(s.heading, t) + sectionDetails(t, c, d)
      return card(t, cr, content)
    }
    case 'documents': {
      const docs = sectionDocuments(t, c, d)
      if (!docs) return ''
      return card(t, cr, heading(s.heading, t) + docs)
    }
    case 'coordinator': {
      const content = heading(s.heading, t) + sectionCoordinator(t, c, d)
      return card(t, cr, content)
    }
    default: return ''
  }
}

// ─── Per-template header + footer ─────────────────────────────────────────────

function renderHeader(t, c, logoUrl) {
  if (t.layout === 'classic') {
    return `
      <tr><td align="center" style="background-color:${t.headerBg};padding:28px 40px;border-radius:8px 8px 0 0">
        <div style="margin-bottom:10px;text-align:center">${logo(logoUrl, t, 44, 'circle', true)}</div>
        <div style="color:${t.headerText};font-size:18px;font-weight:400;letter-spacing:0.04em;margin-bottom:4px;font-family:${t.font};text-align:center">${esc(c.footerName)}</div>
        <div style="color:${t.headerText}80;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-family:${t.font};text-align:center">${esc(c.footerTagline)}</div>
      </td></tr>
      <tr><td style="height:3px;background-color:${t.accent};font-size:0;line-height:0">&nbsp;</td></tr>`
  }

  // All other layouts: logo + name left-aligned via table
  const logoEl = logo(logoUrl, t, t.layout === 'pearl' ? 38 : 40, t.layout === 'pearl' ? 'circle' : 'rounded')
  const headerPad = t.layout === 'minimal' ? '22px 36px' : t.layout === 'dusk' ? '28px 36px' : '24px 36px'
  const borderBottom = t.layout === 'dusk' ? `border-bottom:1px solid ${t.border}` : ''
  const rightLabel = (t.layout === 'minimal' || t.layout === 'dusk')
    ? `<td align="right" valign="middle" style="font-size:11px;color:${t.headerText}60;letter-spacing:0.06em;text-transform:uppercase;font-family:${t.font}">Case Update</td>`
    : ''

  return `
    <tr><td style="background-color:${t.headerBg};padding:${headerPad};border-radius:8px 8px 0 0;${borderBottom}">
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
        <td valign="middle" width="54">${logoEl}</td>
        <td valign="middle" style="padding-left:${t.layout === 'garden' ? '14' : '10'}px">
          <div style="color:${t.headerText};font-weight:600;font-size:${t.layout === 'dusk' ? '15' : '16'}px;letter-spacing:${t.layout === 'dusk' ? '0.04em' : '0'};font-family:${t.font}">${esc(c.footerName)}</div>
          ${t.layout !== 'minimal' ? `<div style="color:${t.headerText}80;font-size:11px;margin-top:2px;font-family:${t.font}">${esc(c.footerTagline)}</div>` : ''}
        </td>
        ${rightLabel}
      </tr></table>
    </td></tr>`
}

function renderGreeting(t, c, d) {
  const isClassic = t.layout === 'classic'
  const align = isClassic ? 'center' : 'left'
  const familyStyle = `font-size:${c.headingSize}px;color:${t.layout === 'dusk' ? t.accent : c.headingColor};font-weight:${t.font.includes('serif') ? 400 : 600};line-height:1.3;margin-bottom:6px;font-family:${t.font}`
  const subStyle = `font-size:${c.fontSize - 1}px;color:${t.muted};font-family:${t.font}`
  const sub = isClassic
    ? `In memory of ${esc(d.deceased)}`
    : t.layout === 'ember'
    ? `Caring for ${esc(d.deceased)} · ${esc(d.package)}`
    : t.layout === 'dusk'
    ? `Regarding the care of ${esc(d.deceased)}`
    : t.layout === 'garden'
    ? `In care of ${esc(d.deceased)}`
    : `Case for ${esc(d.deceased)} · ${esc(d.package)}`

  const extras = t.layout === 'dusk'
    ? `<div style="width:48px;height:1px;background-color:${t.accent};margin-top:16px;font-size:0;line-height:0">&nbsp;</div>`
    : isClassic
    ? hr(t.border || '#E0E0E0', '20px 0')
    : ''

  const displayName = c.greeting || (t.layout === 'garden' ? `Dear ${esc(d.family)},` : esc(d.family))

  return `<div style="text-align:${align};margin-bottom:20px">
    <div style="${familyStyle}">${displayName}</div>
    <div style="${subStyle}">${sub}</div>
    ${extras}
  </div>`
}

function renderFooter(t, c) {
  if (t.layout === 'minimal') {
    return `<tr><td style="background-color:${t.footerBg};padding:18px 36px;border-radius:0 0 8px 8px">
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
        <td style="font-size:13px;font-weight:700;color:${t.footerText};font-family:${t.font}">${esc(c.footerName)}</td>
        <td align="right" style="font-size:11px;color:${t.footerText};opacity:0.7;font-family:${t.font}">${esc(c.footerCopyright)}</td>
      </tr></table>
    </td></tr>`
  }
  if (t.layout === 'dusk') {
    return `<tr><td style="background-color:${t.footerBg};padding:18px 36px;border-top:1px solid ${t.border};border-radius:0 0 8px 8px">
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>
        <td style="font-size:13px;color:${t.footerText};letter-spacing:0.04em;font-family:${t.font}">${esc(c.footerName)}</td>
        <td align="right" style="font-size:11px;color:${t.footerText};opacity:0.6;font-family:${t.font}">${esc(c.footerCopyright)}</td>
      </tr></table>
    </td></tr>`
  }
  return `<tr><td align="center" style="background-color:${t.footerBg};padding:20px 36px;border-radius:0 0 8px 8px">
    <div style="color:${t.footerText};font-size:13px;font-weight:600;margin-bottom:6px;font-family:${t.font}">${esc(c.footerName)}</div>
    <div style="color:${t.footerText};font-size:12px;opacity:0.75;line-height:1.5;font-family:${t.font}">${esc(c.footerAddress)}</div>
    <div style="color:${t.footerText};font-size:11px;opacity:0.55;margin-top:10px;font-family:${t.font}">${esc(c.footerCopyright)}</div>
  </td></tr>`
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateEmailHtml(template, sections, config, caseData, logoUrl) {
  const t = template
  const c = config
  const d = { ...SAMPLE, ...caseData }
  const stepIdx = Math.max(0, STATUS_ORDER.indexOf(d.status))
  const enabled = (sections || DEFAULT_SECTIONS).filter(s => s.enabled)
  const bodyPad = t.layout === 'classic' ? '32px 48px' : '28px 36px'

  const sectionsHtml = enabled.map(s => renderSection(s, t, c, d, stepIdx)).join('\n')

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${esc(c.footerName)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#e8e8e8;font-family:${esc(t.font)}">
<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#e8e8e8;font-family:${esc(t.font)}">
<tr><td align="center" style="padding:24px 12px">
<table cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;max-width:600px;width:100%;border-radius:8px;overflow:hidden">

${renderHeader(t, c, logoUrl)}

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
