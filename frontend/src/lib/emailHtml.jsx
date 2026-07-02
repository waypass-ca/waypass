import { renderToStaticMarkup } from 'react-dom/server'
import { EditableEmailPreview, DEFAULT_SECTIONS, DEFAULT_PROGRESS_LABELS, SAMPLE } from '../components/dashboard/EmailEditorPage'

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
    fontSize:       c.fontSize       ?? 13,
    headingSize:    c.headingSize    ?? 22,
    headingColor:   c.headingColor   ?? template.text,
    message:        c.message        ?? SAMPLE.message,
    greeting:       c.greeting       ?? '',
    progressLabels: c.progressLabels ?? [...DEFAULT_PROGRESS_LABELS],
    buttonLabel:    c.buttonLabel    ?? 'Contact',
    buttonRadius:   8,
    cardRadius:     10,
    footerName:     c.footerName     ?? SAMPLE.funeralHome,
    footerTagline:  c.footerTagline  ?? SAMPLE.tagline,
    footerAddress:  c.footerAddress  ?? '123 Memorial Lane · San Francisco · (415) 555-0100',
    footerCopyright: c.footerCopyright ?? `© 2024 ${SAMPLE.funeralHome} · Unsubscribe`,
  }
}

export function generateEmailHtml(template, sections, config, caseData, logoUrl) {
  const bodyHtml = renderToStaticMarkup(
    <EditableEmailPreview
      template={template}
      sections={sections ?? DEFAULT_SECTIONS}
      config={config}
      caseData={caseData}
      logoUrl={logoUrl ?? ''}
    />
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Case Update</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${template.bg ?? '#ffffff'};">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center">
${bodyHtml}
</td></tr>
</table>
</body>
</html>`
}
