import { useState, useEffect, useRef } from 'react'
import { Star, Check, X, Eye, GripVertical, ChevronLeft, ChevronRight, Pencil, RotateCcw, PanelTop, AlignLeft, PanelBottom, Search } from 'lucide-react'
import { PageTitle } from '../layout/PageTitle'
import { fetchPortalSettings, fetchEmailTemplate, saveEmailTemplate, fetchEmailOverride, saveEmailOverride } from '../../lib/api.js'
import { useUser } from '../../context/UserContext.jsx'

// ─── Sample data ──────────────────────────────────────────────────────────────

export const SAMPLE = {
  funeralHome: 'Evergreen Memorial',
  tagline: 'Compassionate care, with dignity.',
  deceased: 'Margaret Elizabeth Chen',
  family: 'The Chen Family',
  status: 'transit',
  package: 'Comfort Package',
  coordinator: 'Sarah Mitchell',
  coordinatorPhone: '(415) 555-0192',
  date: 'March 15, 2024',
  documents: ['Death Certificate.pdf', 'Cremation Authorization.pdf'],
  message:
    'Our deepest sympathies are with your family during this difficult time. We are honoured to serve you and will be with you every step of the way.',
}

const STEPS = [
  { key: 'pending',   label: 'Case Received' },
  { key: 'transit',   label: 'In Transit' },
  { key: 'cremation', label: 'At Cremation' },
  { key: 'complete',  label: 'Complete' },
]
const STATUS_ORDER = ['pending', 'transit', 'cremation', 'complete']

// ─── Template definitions ─────────────────────────────────────────────────────
// id, name, tagline, theme object, layout variant (drives EmailPreview rendering)

export const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Timeless & dignified',
    layout: 'classic',
    headerBg: '#2B3F2E',
    headerText: '#FFFFFF',
    bg: '#F8F5F0',
    cardBg: '#FFFFFF',
    accent: '#7A5C1E',
    progressActive: '#2B3F2E',
    text: '#231E14',
    muted: '#7A7060',
    border: '#E4DDD3',
    font: 'Georgia, "Times New Roman", serif',
    footerBg: '#2B3F2E',
    footerText: '#A8BEA8',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Clean & modern',
    layout: 'minimal',
    headerBg: '#111111',
    headerText: '#FFFFFF',
    bg: '#F5F5F5',
    cardBg: '#FFFFFF',
    accent: '#0066CC',
    progressActive: '#0066CC',
    text: '#111111',
    muted: '#888888',
    border: 'transparent',
    font: '-apple-system, "Helvetica Neue", sans-serif',
    footerBg: '#111111',
    footerText: '#666666',
  },
  {
    id: 'ember',
    name: 'Ember',
    tagline: 'Warm & comforting',
    layout: 'ember',
    headerBg: '#5C2E1A',
    headerText: '#FFF0E6',
    bg: '#FFFAF6',
    cardBg: '#FFF4EC',
    accent: '#C0521C',
    progressActive: '#C0521C',
    text: '#2C1508',
    muted: '#9A7060',
    border: '#F0D8C8',
    font: 'Georgia, "Times New Roman", serif',
    footerBg: '#5C2E1A',
    footerText: '#D4A898',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    tagline: 'Elegant & refined',
    layout: 'dusk',
    headerBg: '#0D1B2A',
    headerText: '#D4B896',
    bg: '#0D1B2A',
    cardBg: '#152336',
    accent: '#C9A96E',
    progressActive: '#C9A96E',
    text: '#EDE8DF',
    muted: '#7A8FA8',
    border: '#1E3348',
    font: 'Georgia, "Times New Roman", serif',
    footerBg: '#07111C',
    footerText: '#4A6080',
  },
  {
    id: 'garden',
    name: 'Garden',
    tagline: 'Natural & peaceful',
    layout: 'garden',
    headerBg: '#3D6142',
    headerText: '#ECFAEE',
    bg: '#F4FAF4',
    cardBg: '#FFFFFF',
    accent: '#5A9462',
    progressActive: '#3D6142',
    text: '#152018',
    muted: '#5A7060',
    border: '#C8E4CC',
    font: '"Helvetica Neue", Arial, sans-serif',
    footerBg: '#3D6142',
    footerText: '#A8CCA8',
  },
  {
    id: 'pearl',
    name: 'Pearl',
    tagline: 'Soft & compassionate',
    layout: 'pearl',
    headerBg: '#5A2D42',
    headerText: '#FFF0F5',
    bg: '#FDF8FA',
    cardBg: '#FFFFFF',
    accent: '#A84E6E',
    progressActive: '#A84E6E',
    text: '#261018',
    muted: '#8A6070',
    border: '#EDD4DE',
    font: '"Helvetica Neue", Arial, sans-serif',
    footerBg: '#5A2D42',
    footerText: '#C898AC',
  },
]

// ─── Progress tracker variants ────────────────────────────────────────────────

function ProgressDots({ t, stepIdx, steps = STEPS }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {steps.map((s, i) => {
        const done = i <= stepIdx
        const active = i === stepIdx
        return (
          <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i < steps.length - 1 && (
              <div style={{ position: 'absolute', top: 12, left: '50%', width: '100%', height: 2, backgroundColor: i < stepIdx ? t.progressActive : t.border || '#E0E0E0' }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, width: 24, height: 24, borderRadius: '50%', border: `2px solid ${done ? t.progressActive : (t.border || '#E0E0E0')}`, backgroundColor: done ? t.progressActive : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {done && !active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
              {active && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'white' }} />}
            </div>
            <div style={{ fontSize: 10, color: done ? t.text : t.muted, marginTop: 6, textAlign: 'center', lineHeight: 1.3, padding: '0 2px' }}>{s.label}</div>
          </div>
        )
      })}
    </div>
  )
}

function ProgressBar({ t, stepIdx, steps = STEPS }) {
  const pct = Math.round(((stepIdx + 1) / steps.length) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: t.text, fontWeight: 600 }}>{steps[stepIdx].label}</span>
        <span style={{ fontSize: 11, color: t.accent, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, backgroundColor: t.border || '#E8E0D8', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, backgroundColor: t.progressActive }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: i <= stepIdx ? t.progressActive : t.muted, fontWeight: i <= stepIdx ? 600 : 400 }}>{s.label}</div>
        ))}
      </div>
    </div>
  )
}

function ProgressPills({ t, stepIdx, steps = STEPS }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {steps.map((s, i) => {
        const done = i <= stepIdx
        return (
          <div key={s.key} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, backgroundColor: done ? t.progressActive : (t.border || '#E8E0D8'), textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: done ? 'white' : t.muted, fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        )
      })}
    </div>
  )
}

function ProgressTimeline({ t, stepIdx, steps = STEPS }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((s, i) => {
        const done = i <= stepIdx
        const active = i === stepIdx
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${done ? t.progressActive : (t.border || '#E0E0E0')}`, backgroundColor: done ? t.progressActive : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                {done && !active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.progressActive }} />}
              </div>
              {i < steps.length - 1 && <div style={{ width: 2, height: 20, backgroundColor: i < stepIdx ? t.progressActive : (t.border || '#E0E0E0') }} />}
            </div>
            <div style={{ paddingTop: 2, paddingBottom: i < STEPS.length - 1 ? 0 : 0 }}>
              <div style={{ fontSize: 12, color: done ? t.text : t.muted, fontWeight: done ? 600 : 400, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared logo renderer for email headers ─────────────────────────────────

function EmailLogo({ logoUrl, fallbackColor, style }) {
  if (logoUrl) return <img src={logoUrl} alt="Logo" style={{ height: 32, maxWidth: 100, objectFit: 'contain', ...style }} />
  return (
    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...style }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: fallbackColor || 'white' }}>EG</span>
    </div>
  )
}

// ─── Full email previews — each layout is genuinely different ─────────────────
// Classic: NO cards — centered, decorative rules, inline sections
// Minimal: NO cards — flat with shadows only on hover-like areas, spacious
// Ember: MIXED — message flat, progress + docs in cards
// Dusk: NO cards — dark bg, gold rules separate sections
// Garden: MIXED — timeline flat, coordinator in colored block, docs in card
// Pearl: ALL cards — colored top borders on every section

function ClassicEmail({ t, logoUrl }) {
  const stepIdx = STATUS_ORDER.indexOf(SAMPLE.status)
  const sep = <div style={{ borderTop: `1px solid ${t.border}`, margin: '20px 0' }} />
  return (
    <div style={{ fontFamily: t.font, backgroundColor: t.bg, color: t.text }}>
      <div style={{ backgroundColor: t.headerBg, padding: '28px 40px', textAlign: 'center' }}>
        <div style={{ marginBottom: 10 }}>
          <EmailLogo logoUrl={logoUrl} fallbackColor={t.headerText} style={logoUrl ? { margin: '0 auto' } : { margin: '0 auto', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)' }} />
        </div>
        <div style={{ color: t.headerText, fontSize: 18, fontWeight: 400, letterSpacing: '0.04em', marginBottom: 4 }}>{SAMPLE.funeralHome}</div>
        <div style={{ color: t.headerText + '80', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{SAMPLE.tagline}</div>
      </div>
      <div style={{ backgroundColor: t.accent, height: 3 }} />

      <div style={{ padding: '32px 48px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 22, color: t.text, letterSpacing: '0.02em', marginBottom: 6 }}>{SAMPLE.family}</div>
          <div style={{ fontSize: 12, color: t.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>In memory of {SAMPLE.deceased}</div>
        </div>

        {sep}

        <div style={{ borderLeft: `3px solid ${t.accent}`, paddingLeft: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: t.text + 'CC', lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>{SAMPLE.message}</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>Case Progress</div>
          <ProgressDots t={t} stepIdx={stepIdx} />
        </div>

        {sep}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Case Details</div>
            {[['Deceased', SAMPLE.deceased], ['Date', SAMPLE.date], ['Package', SAMPLE.package]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 8, borderBottom: `1px dotted ${t.border}`, paddingBottom: 6 }}>
                <div style={{ fontSize: 10, color: t.muted }}>{l}</div>
                <div style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Documents</div>
            {SAMPLE.documents.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, borderBottom: `1px dotted ${t.border}`, paddingBottom: 6 }}>
                <span style={{ fontSize: 10, color: t.accent, fontWeight: 700 }}>PDF</span>
                <span style={{ fontSize: 11, color: t.text }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {sep}

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Your Coordinator</div>
          <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 2 }}>{SAMPLE.coordinator}</div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>{SAMPLE.coordinatorPhone}</div>
          <div style={{ display: 'inline-block', border: `1px solid ${t.accent}`, color: t.accent, borderRadius: 4, padding: '8px 24px', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Send Message</div>
        </div>
      </div>

      <div style={{ backgroundColor: t.footerBg, padding: '20px 40px', textAlign: 'center' }}>
        <div style={{ color: t.footerText, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{SAMPLE.funeralHome}</div>
        <div style={{ color: t.footerText, fontSize: 12, opacity: 0.75 }}>123 Memorial Lane · San Francisco · (415) 555-0100</div>
        <div style={{ marginTop: 10, color: t.footerText, fontSize: 11, opacity: 0.5 }}>Unsubscribe · Privacy</div>
      </div>
    </div>
  )
}

function MinimalEmail({ t, logoUrl }) {
  const stepIdx = STATUS_ORDER.indexOf(SAMPLE.status)
  return (
    <div style={{ fontFamily: t.font, backgroundColor: t.bg, color: t.text }}>
      <div style={{ backgroundColor: t.headerBg, padding: '22px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EmailLogo logoUrl={logoUrl} fallbackColor={t.headerBg} style={logoUrl ? {} : { backgroundColor: 'white', borderRadius: 6, width: 32, height: 32 }} />
          <span style={{ color: t.headerText, fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{SAMPLE.funeralHome}</span>
        </div>
        <span style={{ color: t.headerText + '60', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Case Update</span>
      </div>

      <div style={{ padding: '36px 36px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.text, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 8 }}>Hello, {SAMPLE.family.replace('The ', '').replace(' Family', '')}</div>
          <div style={{ fontSize: 13, color: t.muted }}>Here's an update on {SAMPLE.deceased}'s case.</div>
        </div>

        <p style={{ fontSize: 14, color: t.text, lineHeight: 1.75, margin: '0 0 28px' }}>{SAMPLE.message}</p>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
            <span style={{ fontSize: 11, color: t.accent, fontWeight: 600, backgroundColor: t.accent + '15', padding: '3px 10px', borderRadius: 99 }}>{STEPS[stepIdx].label}</span>
          </div>
          <ProgressBar t={t} stepIdx={stepIdx} />
        </div>

        <div style={{ height: 1, backgroundColor: '#E5E5EA', margin: '0 0 24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Details</div>
            {[['Deceased', SAMPLE.deceased], ['Date', SAMPLE.date], ['Package', SAMPLE.package]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: t.muted }}>{l}</div>
                <div style={{ fontSize: 13, color: t.text, fontWeight: 500, marginTop: 1 }}>{v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Files</div>
            {SAMPLE.documents.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: t.accent, fontWeight: 700 }}>PDF</span>
                <span style={{ fontSize: 12, color: t.text }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: '#E5E5EA', margin: '0 0 24px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>SM</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{SAMPLE.coordinator}</div>
            <div style={{ fontSize: 11, color: t.muted }}>{SAMPLE.coordinatorPhone}</div>
          </div>
          <div style={{ backgroundColor: t.accent, color: 'white', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 600 }}>Contact</div>
        </div>
      </div>

      <div style={{ backgroundColor: t.footerBg, padding: '18px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.footerText }}>{SAMPLE.funeralHome}</span>
        <span style={{ fontSize: 11, color: t.footerText, opacity: 0.7 }}>© 2024 · Unsubscribe</span>
      </div>
    </div>
  )
}

function EmberEmail({ t, logoUrl }) {
  const stepIdx = STATUS_ORDER.indexOf(SAMPLE.status)
  return (
    <div style={{ fontFamily: t.font, backgroundColor: t.bg }}>
      {/* Hero header with greeting baked in */}
      <div style={{ backgroundColor: t.headerBg, padding: '30px 40px', backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <EmailLogo logoUrl={logoUrl} fallbackColor={t.headerText} />
          <div>
            <div style={{ color: t.headerText, fontWeight: 600, fontSize: 16 }}>{SAMPLE.funeralHome}</div>
            <div style={{ color: t.headerText, fontSize: 11, opacity: 0.6 }}>{SAMPLE.tagline}</div>
          </div>
        </div>
        <div style={{ color: t.headerText, fontSize: 24, fontWeight: 400, lineHeight: 1.3, marginBottom: 6 }}>{SAMPLE.family}</div>
        <div style={{ color: t.headerText, fontSize: 13, opacity: 0.7 }}>Caring for {SAMPLE.deceased} · {SAMPLE.package}</div>
      </div>

      <div style={{ padding: '28px 40px' }}>
        {/* Message — flat with decorative quote, no card */}
        <div style={{ position: 'relative', marginBottom: 24, paddingLeft: 20 }}>
          <div style={{ position: 'absolute', top: -4, left: 0, fontSize: 44, color: t.accent + '30', fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
          <p style={{ fontSize: 13, color: t.text + 'CC', lineHeight: 1.8, margin: 0 }}>{SAMPLE.message}</p>
        </div>

        {/* Progress — in a card */}
        <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '18px 22px', marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Case Progress</div>
          <ProgressBar t={t} stepIdx={stepIdx} />
        </div>

        {/* Documents — in a card */}
        <div style={{ backgroundColor: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '18px 22px', marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Your Documents</div>
          {SAMPLE.documents.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: t.bg, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ width: 34, height: 38, borderRadius: 5, backgroundColor: t.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: t.accent }}>PDF</span>
              </div>
              <span style={{ fontSize: 13, color: t.text, flex: 1 }}>{d}</span>
              <span style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>View →</span>
            </div>
          ))}
        </div>

        {/* Details — flat, no card */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Case Details</div>
          {[['Deceased', SAMPLE.deceased], ['Date', SAMPLE.date], ['Package', SAMPLE.package]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', gap: 12, marginBottom: 6, borderBottom: `1px solid ${t.border}`, paddingBottom: 6 }}>
              <div style={{ fontSize: 11, color: t.muted, width: 70, flexShrink: 0 }}>{l}</div>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Coordinator — flat */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: t.accent + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: t.accent, fontWeight: 700 }}>SM</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: t.text, fontWeight: 600 }}>{SAMPLE.coordinator}</div>
            <div style={{ fontSize: 11, color: t.muted }}>{SAMPLE.coordinatorPhone}</div>
          </div>
          <div style={{ backgroundColor: t.accent, color: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 500 }}>Message</div>
        </div>
      </div>

      <div style={{ backgroundColor: t.footerBg, padding: '20px 40px', textAlign: 'center' }}>
        <div style={{ color: t.footerText, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{SAMPLE.funeralHome}</div>
        <div style={{ color: t.footerText, fontSize: 12, opacity: 0.7 }}>123 Memorial Lane · (415) 555-0100 · Unsubscribe</div>
      </div>
    </div>
  )
}

function DuskEmail({ t, logoUrl }) {
  const stepIdx = STATUS_ORDER.indexOf(SAMPLE.status)
  const rule = <div style={{ height: 1, backgroundColor: t.accent + '30', margin: '22px 0' }} />
  return (
    <div style={{ fontFamily: t.font, backgroundColor: t.bg }}>
      <div style={{ backgroundColor: t.headerBg, padding: '28px 36px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EmailLogo logoUrl={logoUrl} fallbackColor={t.accent} style={logoUrl ? {} : { border: `1px solid ${t.accent}50`, borderRadius: 6, width: 36, height: 36 }} />
            <div style={{ color: t.headerText, fontWeight: 400, fontSize: 15, letterSpacing: '0.04em' }}>{SAMPLE.funeralHome}</div>
          </div>
          <div style={{ color: t.muted, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Case Update</div>
        </div>
      </div>

      <div style={{ padding: '30px 36px' }}>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 24, color: t.accent, fontWeight: 400, letterSpacing: '0.02em', lineHeight: 1.3, marginBottom: 6 }}>{SAMPLE.family}</div>
          <div style={{ fontSize: 12, color: t.muted }}>Regarding the care of {SAMPLE.deceased}</div>
          <div style={{ width: 48, height: 1, backgroundColor: t.accent, marginTop: 16 }} />
        </div>

        {rule}

        <p style={{ fontSize: 13, color: t.text, lineHeight: 1.8, margin: 0, opacity: 0.8 }}>{SAMPLE.message}</p>

        {rule}

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 10, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Progress</div>
          <ProgressPills t={t} stepIdx={stepIdx} />
        </div>

        {rule}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 10, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Details</div>
            {[['Deceased', SAMPLE.deceased], ['Date', SAMPLE.date], ['Package', SAMPLE.package]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: t.muted }}>{l}</div>
                <div style={{ fontSize: 12, color: t.text, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Documents</div>
            {SAMPLE.documents.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: t.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: t.text }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {rule}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{SAMPLE.coordinator}</div>
            <div style={{ fontSize: 11, color: t.muted }}>{SAMPLE.coordinatorPhone}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'inline-block', border: `1px solid ${t.accent}`, color: t.accent, borderRadius: 6, padding: '8px 20px', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contact</div>
        </div>
      </div>

      <div style={{ backgroundColor: t.footerBg, padding: '18px 36px', borderTop: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: t.footerText, letterSpacing: '0.04em' }}>{SAMPLE.funeralHome}</span>
          <span style={{ fontSize: 11, color: t.footerText, opacity: 0.6 }}>© 2024 · Unsubscribe</span>
        </div>
      </div>
    </div>
  )
}

function GardenEmail({ t, logoUrl }) {
  const stepIdx = STATUS_ORDER.indexOf(SAMPLE.status)
  return (
    <div style={{ fontFamily: t.font, backgroundColor: t.bg }}>
      <div style={{ backgroundColor: t.headerBg, padding: '24px 36px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <EmailLogo logoUrl={logoUrl} fallbackColor={t.headerText} style={logoUrl ? {} : { borderRadius: 10, width: 42, height: 42 }} />
        <div>
          <div style={{ color: t.headerText, fontWeight: 600, fontSize: 16 }}>{SAMPLE.funeralHome}</div>
          <div style={{ color: t.headerText, fontSize: 11, marginTop: 2, opacity: 0.7 }}>{SAMPLE.tagline}</div>
        </div>
      </div>

      <div style={{ padding: '36px 40px' }}>
        {/* Greeting + message flat — no card */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 26, color: t.text, fontWeight: 300, lineHeight: 1.25, marginBottom: 8 }}>Dear {SAMPLE.family},</div>
          <p style={{ fontSize: 14, color: t.text, lineHeight: 1.8, margin: 0, opacity: 0.75 }}>{SAMPLE.message}</p>
        </div>

        {/* Progress — flat vertical timeline, no card */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>Case Progress</div>
          <ProgressTimeline t={t} stepIdx={stepIdx} />
        </div>

        {/* Documents — in a card */}
        <div style={{ backgroundColor: t.cardBg, borderRadius: 14, padding: '22px 26px', marginBottom: 18, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Documents</div>
          {SAMPLE.documents.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: t.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: t.accent }}>PDF</span>
              </div>
              <span style={{ fontSize: 13, color: t.text, flex: 1 }}>{d}</span>
              <span style={{ fontSize: 12, color: t.accent }}>↓</span>
            </div>
          ))}
        </div>

        {/* Case details — flat, no card */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Case Details</div>
          {[['Deceased', SAMPLE.deceased], ['Date', SAMPLE.date], ['Package', SAMPLE.package]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 10, color: t.muted, width: 60, flexShrink: 0, paddingTop: 2 }}>{l}</div>
              <div style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Coordinator — colored block card */}
        <div style={{ backgroundColor: t.accent, borderRadius: 14, padding: '20px 22px', textAlign: 'center', marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>SM</span>
          </div>
          <div style={{ fontSize: 13, color: 'white', fontWeight: 600, marginBottom: 2 }}>{SAMPLE.coordinator}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>{SAMPLE.coordinatorPhone}</div>
          <div style={{ backgroundColor: 'white', color: t.accent, borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 600 }}>Contact</div>
        </div>
      </div>

      <div style={{ backgroundColor: t.footerBg, padding: '20px 40px', textAlign: 'center' }}>
        <div style={{ color: t.footerText, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{SAMPLE.funeralHome}</div>
        <div style={{ color: t.footerText, fontSize: 12, opacity: 0.7 }}>123 Memorial Lane · (415) 555-0100</div>
        <div style={{ color: t.footerText, fontSize: 11, marginTop: 8, opacity: 0.5 }}>Unsubscribe</div>
      </div>
    </div>
  )
}

function PearlEmail({ t, logoUrl }) {
  const stepIdx = STATUS_ORDER.indexOf(SAMPLE.status)
  const card = (topColor) => ({ backgroundColor: t.cardBg, borderRadius: 14, borderTop: `4px solid ${topColor}`, padding: '20px 24px', marginBottom: 14, boxShadow: '0 2px 10px rgba(90,45,66,0.06)' })
  return (
    <div style={{ fontFamily: t.font, backgroundColor: t.bg }}>
      <div style={{ backgroundColor: t.headerBg, padding: '24px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EmailLogo logoUrl={logoUrl} fallbackColor={t.headerText} style={logoUrl ? {} : { borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', width: 38, height: 38 }} />
          <div>
            <div style={{ color: t.headerText, fontWeight: 600, fontSize: 15 }}>{SAMPLE.funeralHome}</div>
            <div style={{ color: t.headerText, fontSize: 11, opacity: 0.65 }}>{SAMPLE.tagline}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 36px' }}>
        <div style={card(t.accent)}>
          <div style={{ fontSize: 20, color: t.text, fontWeight: 400, marginBottom: 8 }}>{SAMPLE.family}</div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 16 }}>In care of {SAMPLE.deceased} · {SAMPLE.package}</div>
          <p style={{ fontSize: 13, color: t.text, lineHeight: 1.75, margin: 0, opacity: 0.75 }}>{SAMPLE.message}</p>
        </div>

        <div style={card(t.progressActive)}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Case Progress</div>
          <ProgressPills t={t} stepIdx={stepIdx} />
        </div>

        <div style={card(t.accent + '90')}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Documents</div>
          {SAMPLE.documents.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', backgroundColor: t.bg, borderRadius: 8, marginBottom: 6 }}>
              <div style={{ width: 30, height: 34, borderRadius: 4, backgroundColor: t.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: t.accent }}>PDF</span>
              </div>
              <span style={{ fontSize: 12, color: t.text }}>{d}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
          <div style={card(t.border)}>
            <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Details</div>
            {[['Deceased', SAMPLE.deceased], ['Date', SAMPLE.date], ['Package', SAMPLE.package]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: t.muted }}>{l}</div>
                <div style={{ fontSize: 12, color: t.text, fontWeight: 500, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={card(t.accent)}>
            <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Coordinator</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: t.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: t.accent, fontWeight: 700 }}>SM</span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: t.text, fontWeight: 600 }}>{SAMPLE.coordinator}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{SAMPLE.coordinatorPhone}</div>
              </div>
            </div>
            <div style={{ backgroundColor: t.accent, color: 'white', borderRadius: 8, padding: '7px 0', textAlign: 'center', fontSize: 12, fontWeight: 500 }}>Message</div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: t.footerBg, padding: '20px 36px', textAlign: 'center' }}>
        <div style={{ color: t.footerText, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{SAMPLE.funeralHome}</div>
        <div style={{ color: t.footerText, fontSize: 12, opacity: 0.7 }}>123 Memorial Lane · (415) 555-0100 · Unsubscribe</div>
      </div>
    </div>
  )
}

export function EmailPreview({ t, logoUrl }) {
  switch (t.layout) {
    case 'classic': return <ClassicEmail t={t} logoUrl={logoUrl} />
    case 'minimal': return <MinimalEmail t={t} logoUrl={logoUrl} />
    case 'ember':   return <EmberEmail t={t} logoUrl={logoUrl} />
    case 'dusk':    return <DuskEmail t={t} logoUrl={logoUrl} />
    case 'garden':  return <GardenEmail t={t} logoUrl={logoUrl} />
    case 'pearl':   return <PearlEmail t={t} logoUrl={logoUrl} />
    default:        return <ClassicEmail t={t} logoUrl={logoUrl} />
  }
}


// ─── Thumbnail (mini scaled card) ────────────────────────────────────────────

function TemplateThumbnail({ t }) {
  const stepIdx = STATUS_ORDER.indexOf(SAMPLE.status)

  const isLight = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
  }

  return (
    <div className="rounded-lg overflow-hidden w-full" style={{ backgroundColor: t.bg }}>
      {/* Header */}
      <div style={{ backgroundColor: t.headerBg, padding: t.layout === 'classic' ? '8px 10px' : '6px 10px', textAlign: t.layout === 'classic' ? 'center' : 'left' }}>
        {t.layout === 'classic' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 6, color: t.headerText, fontWeight: 700 }}>EG</span>
            </div>
            <div style={{ height: 1.5, width: '50%', backgroundColor: t.headerText + 'AA', borderRadius: 99 }} />
            <div style={{ height: 1, width: '35%', backgroundColor: t.headerText + '55', borderRadius: 99 }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <div style={{ height: 1.5, width: '40%', backgroundColor: t.headerText + 'AA', borderRadius: 99 }} />
          </div>
        )}
      </div>

      {t.layout === 'classic' && <div style={{ height: 2, backgroundColor: t.accent }} />}

      <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Greeting lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: t.layout === 'classic' ? 'center' : 'flex-start' }}>
          <div style={{ height: 2, width: '55%', backgroundColor: t.text + '40', borderRadius: 99 }} />
          <div style={{ height: 1.5, width: '40%', backgroundColor: t.muted + '50', borderRadius: 99 }} />
        </div>

        {/* Message */}
        <div style={{
          borderLeft: t.layout !== 'classic' && t.layout !== 'dusk' && t.layout !== 'pearl' ? `2px solid ${t.accent}` : undefined,
          borderTop: t.layout === 'pearl' ? `2px solid ${t.accent}` : undefined,
          borderRadius: t.layout === 'pearl' ? 4 : 3,
          padding: '3px 5px',
          backgroundColor: t.cardBg,
          boxShadow: t.layout === 'minimal' ? '0 1px 3px rgba(0,0,0,0.07)' : undefined,
        }}>
          <div style={{ height: 1, backgroundColor: t.text + '20', borderRadius: 99, marginBottom: 1.5 }} />
          <div style={{ height: 1, width: '75%', backgroundColor: t.text + '15', borderRadius: 99 }} />
        </div>

        {/* Progress */}
        <div style={{ backgroundColor: t.cardBg, borderRadius: 3, padding: '3px 5px', boxShadow: t.layout === 'minimal' ? '0 1px 3px rgba(0,0,0,0.07)' : undefined, borderTop: t.layout === 'pearl' ? `2px solid ${t.progressActive}` : undefined }}>
          {t.layout === 'ember' || t.layout === 'minimal' ? (
            <div>
              <div style={{ height: 1.5, backgroundColor: t.border || '#E0E0E0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '50%', backgroundColor: t.progressActive, borderRadius: 99 }} />
              </div>
            </div>
          ) : t.layout === 'dusk' || t.layout === 'pearl' ? (
            <div style={{ display: 'flex', gap: 1.5 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= stepIdx ? t.progressActive : (t.border || '#E0E0E0') }} />
              ))}
            </div>
          ) : t.layout === 'garden' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {STEPS.slice(0, 3).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: i <= stepIdx ? t.progressActive : (t.border || '#E0E0E0'), flexShrink: 0 }} />
                  <div style={{ height: 1, flex: 1, backgroundColor: t.text + '18', borderRadius: 99 }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STEPS.map((_, i) => {
                const done = i <= stepIdx
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {i < STEPS.length - 1 && <div style={{ position: 'absolute', top: 4, left: '50%', width: '100%', height: 1, backgroundColor: i < stepIdx ? t.progressActive : (t.border || '#E0E0E0') }} />}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1px solid ${done ? t.progressActive : (t.border || '#E0E0E0')}`, backgroundColor: done ? t.progressActive : 'transparent', position: 'relative', zIndex: 1 }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Two mini cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              backgroundColor: i === 1 && t.layout === 'garden' ? t.accent : t.cardBg,
              borderRadius: 3,
              padding: '3px 4px',
              boxShadow: t.layout === 'minimal' ? '0 1px 3px rgba(0,0,0,0.07)' : undefined,
              borderTop: t.layout === 'pearl' ? `2px solid ${i === 0 ? t.border : t.accent}` : undefined,
            }}>
              <div style={{ height: 1, width: '55%', marginBottom: 1.5, backgroundColor: i === 1 && t.layout === 'garden' ? 'rgba(255,255,255,0.5)' : t.muted + '40', borderRadius: 99 }} />
              <div style={{ height: 1, backgroundColor: i === 1 && t.layout === 'garden' ? 'rgba(255,255,255,0.3)' : t.text + '20', borderRadius: 99, marginBottom: 1 }} />
              <div style={{ height: 1, width: '70%', backgroundColor: i === 1 && t.layout === 'garden' ? 'rgba(255,255,255,0.2)' : t.text + '15', borderRadius: 99 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: t.footerBg, padding: '4px 8px', display: 'flex', justifyContent: t.layout === 'minimal' ? 'space-between' : 'center', alignItems: 'center' }}>
        <div style={{ height: 1, width: '35%', backgroundColor: t.footerText + '50', borderRadius: 99 }} />
        {t.layout === 'minimal' && <div style={{ height: 1, width: '20%', backgroundColor: t.footerText + '30', borderRadius: 99 }} />}
      </div>
    </div>
  )
}

// ─── Editor constants ─────────────────────────────────────────────────────────

export const DEFAULT_SECTIONS = [
  { id: 'message', label: 'Personal Message', heading: '', enabled: true },
  { id: 'progress', label: 'Progress Tracker', heading: 'Case Progress', enabled: true },
  { id: 'details', label: 'Case Details', heading: 'Case Details', enabled: true },
  { id: 'documents', label: 'Documents', heading: 'Documents', enabled: true },
  { id: 'coordinator', label: 'Coordinator', heading: 'Your Coordinator', enabled: true },
]

export const DEFAULT_PROGRESS_LABELS = ['Case Received', 'In Transit', 'At Cremation', 'Complete']

const PROGRESS_VARIANT = {
  classic: 'dots', minimal: 'bar', ember: 'bar',
  dusk: 'pills', garden: 'timeline', pearl: 'pills',
}

const FONT_OPTIONS = [
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia', sample: 'Aa' },
  { value: '"Cormorant Garamond", Georgia, serif', label: 'Cormorant', sample: 'Aa' },
  { value: '"Playfair Display", Georgia, serif', label: 'Playfair', sample: 'Aa' },
  { value: '"Times New Roman", Times, serif', label: 'Times', sample: 'Aa' },
  { value: '-apple-system, "Helvetica Neue", sans-serif', label: 'System', sample: 'Aa' },
  { value: '"DM Sans", "Helvetica Neue", sans-serif', label: 'DM Sans', sample: 'Aa' },
  { value: '"Inter", "Helvetica Neue", sans-serif', label: 'Inter', sample: 'Aa' },
  { value: '"Lato", "Helvetica Neue", sans-serif', label: 'Lato', sample: 'Aa' },
]

const FONT_SIZES = [
  { value: 12, label: 'S' },
  { value: 13, label: 'M' },
  { value: 14, label: 'L' },
  { value: 16, label: 'XL' },
]

const HEADING_SIZES = [
  { value: 18, label: 'S' },
  { value: 20, label: 'M' },
  { value: 22, label: 'L' },
  { value: 26, label: 'XL' },
]


// ─── Drag-and-drop section list ───────────────────────────────────────────────

function SectionList({ sections, onChange }) {
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  function handleDragStart(e, idx) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, idx) {
    e.preventDefault()
    if (dragIdx !== null && dragIdx !== idx) setOverIdx(idx)
  }

  function handleDrop(e, idx) {
    e.preventDefault()
    if (dragIdx !== null && dragIdx !== idx) {
      const next = [...sections]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      onChange(next)
    }
    setDragIdx(null)
    setOverIdx(null)
  }

  function toggle(idx) {
    const next = [...sections]
    next[idx] = { ...next[idx], enabled: !next[idx].enabled }
    onChange(next)
  }

  function updateHeading(idx, heading) {
    const next = [...sections]
    next[idx] = { ...next[idx], heading }
    onChange(next)
  }

  return (
    <div className="space-y-1">
      {sections.map((s, i) => (
        <div
          key={s.id}
          draggable
          onDragStart={e => handleDragStart(e, i)}
          onDragOver={e => handleDragOver(e, i)}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
          onDrop={e => handleDrop(e, i)}
          className={`rounded-lg border transition-all cursor-grab active:cursor-grabbing select-none
            ${dragIdx === i ? 'opacity-40 border-primary/30' : overIdx === i ? 'border-primary bg-primary/5' : 'border-line bg-white hover:border-secondary/40'}`}
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <GripVertical size={13} className="text-muted flex-shrink-0" />
            <span className={`flex-1 font-sans text-[12.5px] ${s.enabled ? 'text-ink' : 'text-muted line-through'}`}>{s.label}</span>
            <button
              onClick={e => { e.stopPropagation(); toggle(i) }}
              className={`relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors cursor-pointer border-0 outline-none ${s.enabled ? 'bg-primary' : 'bg-line'}`}
            >
              <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${s.enabled ? 'translate-x-[14px]' : 'translate-x-0'}`} />
            </button>
          </div>
          {s.enabled && s.id !== 'message' && (
            <div className="px-2.5 pb-2">
              <input
                type="text"
                value={s.heading}
                onChange={e => updateHeading(i, e.target.value)}
                placeholder={s.label}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                draggable={false}
                className="w-full px-2 py-1 font-sans text-[11px] text-secondary border border-line/60 rounded bg-canvas/50 outline-none focus:border-ink/30 transition cursor-text"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Color picker field ───────────────────────────────────────────────────────

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-7 h-7 flex-shrink-0 rounded-md overflow-hidden border border-line cursor-pointer shadow-sm">
        <div className="absolute inset-0" style={{ backgroundColor: value }} />
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[11px] text-muted leading-none mb-0.5">{label}</p>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full font-mono text-[11px] text-ink bg-transparent outline-none border-0 p-0" />
      </div>
    </div>
  )
}

// ─── Editable email preview ───────────────────────────────────────────────────

export function EditableEmailPreview({ template, sections, config, logoUrl, caseData }) {
  const t = template
  const c = config
  const d = { ...SAMPLE, ...caseData }
  const stepIdx = STATUS_ORDER.indexOf(d.status)
  const enabled = sections.filter(s => s.enabled)
  const variant = PROGRESS_VARIANT[t.layout] || 'dots'
  const customSteps = c.progressLabels.map((label, i) => ({ key: STEPS[i]?.key || `step${i}`, label }))
  const br = c.buttonRadius
  const cr = c.cardRadius

  const headingStyle = { fontSize: 10, color: t.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }
  const cardBase = t.layout === 'minimal'
    ? { backgroundColor: t.cardBg, borderRadius: cr, padding: '18px 22px', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }
    : t.layout === 'pearl'
    ? { backgroundColor: t.cardBg, borderRadius: cr, borderTop: `4px solid ${t.accent}`, padding: '18px 22px', marginBottom: 14, boxShadow: '0 2px 10px rgba(90,45,66,0.06)' }
    : { backgroundColor: t.cardBg, borderRadius: cr, padding: '18px 22px', marginBottom: 14, border: `1px solid ${t.border || '#E0E0E0'}` }

  function renderSection(s) {
    const cs = { ...cardBase }
    switch (s.id) {
      case 'message':
        return (
          <div key={s.id} style={{ ...cs, borderLeft: t.layout !== 'pearl' && t.layout !== 'minimal' ? `3px solid ${t.accent}` : cs.borderLeft }}>
            <p style={{ fontSize: c.fontSize, color: t.text + 'CC', lineHeight: 1.8, margin: 0, fontStyle: t.layout === 'classic' ? 'italic' : 'normal' }}>
              {c.message || d.message}
            </p>
          </div>
        )
      case 'progress':
        return (
          <div key={s.id} style={cs}>
            {s.heading && <div style={headingStyle}>{s.heading}</div>}
            {variant === 'bar' && <ProgressBar t={t} stepIdx={stepIdx} steps={customSteps} />}
            {variant === 'dots' && <ProgressDots t={t} stepIdx={stepIdx} steps={customSteps} />}
            {variant === 'pills' && <ProgressPills t={t} stepIdx={stepIdx} steps={customSteps} />}
            {variant === 'timeline' && <ProgressTimeline t={t} stepIdx={stepIdx} steps={customSteps} />}
          </div>
        )
      case 'details':
        return (
          <div key={s.id} style={cs}>
            {s.heading && <div style={headingStyle}>{s.heading}</div>}
            {[['Deceased', d.deceased], ['Date', d.date], ['Package', d.package]].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: t.muted }}>{l}</div>
                <div style={{ fontSize: c.fontSize - 1, color: t.text, fontWeight: 500, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        )
      case 'documents':
        return (
          <div key={s.id} style={cs}>
            {s.heading && <div style={headingStyle}>{s.heading}</div>}
            {d.documents.map(doc => (
              <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', backgroundColor: t.bg, borderRadius: Math.min(cr, 6), marginBottom: 6 }}>
                <div style={{ width: 26, height: 30, borderRadius: 4, backgroundColor: t.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: t.accent }}>PDF</span>
                </div>
                <span style={{ fontSize: c.fontSize - 1, color: t.text, flex: 1 }}>{doc}</span>
                <span style={{ fontSize: c.fontSize - 2, color: t.accent, fontWeight: 500 }}>View</span>
              </div>
            ))}
          </div>
        )
      case 'coordinator':
        return (
          <div key={s.id} style={cs}>
            {s.heading && <div style={headingStyle}>{s.heading}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: t.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>{(d.coordinator || 'SM').split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: c.fontSize, color: t.text, fontWeight: 600 }}>{d.coordinator}</div>
                <div style={{ fontSize: c.fontSize - 2, color: t.muted, marginTop: 2 }}>{d.coordinatorPhone}</div>
              </div>
              <div style={{ backgroundColor: t.accent, color: 'white', borderRadius: br, padding: '7px 16px', fontSize: c.fontSize - 1, fontWeight: 500 }}>{c.buttonLabel}</div>
            </div>
          </div>
        )
      default: return null
    }
  }

  return (
    <div style={{ fontFamily: t.font, backgroundColor: t.bg, overflow: 'hidden' }}>
      <div style={{ backgroundColor: t.headerBg, padding: t.layout === 'classic' ? '28px 40px' : '22px 36px', textAlign: t.layout === 'classic' ? 'center' : 'left' }}>
        {t.layout === 'classic' ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <EmailLogo logoUrl={logoUrl} fallbackColor={t.headerText} style={logoUrl ? { margin: '0 auto' } : { margin: '0 auto', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', width: 44, height: 44 }} />
            </div>
            <div style={{ color: t.headerText, fontSize: 18, letterSpacing: '0.04em', marginBottom: 4 }}>{c.footerName}</div>
            <div style={{ color: t.headerText + '80', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{c.footerTagline}</div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EmailLogo logoUrl={logoUrl} fallbackColor={t.layout === 'dusk' ? t.accent : t.headerText} />
            <div>
              <div style={{ color: t.headerText, fontWeight: 600, fontSize: 15 }}>{c.footerName}</div>
              <div style={{ color: t.headerText + '80', fontSize: 11, marginTop: 2 }}>{c.footerTagline}</div>
            </div>
          </div>
        )}
      </div>
      {t.layout === 'classic' && <div style={{ height: 3, backgroundColor: t.accent }} />}

      <div style={{ padding: t.layout === 'classic' ? '32px 48px' : '28px 36px' }}>
        <div style={{ marginBottom: 20, textAlign: t.layout === 'classic' ? 'center' : 'left' }}>
          <div style={{ fontSize: c.headingSize, color: t.layout === 'dusk' ? t.accent : c.headingColor, fontWeight: t.font.includes('serif') ? 400 : 600, lineHeight: 1.3, marginBottom: 6 }}>{c.greeting || d.family}</div>
          <div style={{ fontSize: c.fontSize - 1, color: t.muted }}>{t.layout === 'classic' ? `In memory of ${d.deceased}` : `Case for ${d.deceased} · ${d.package}`}</div>
          {t.layout === 'dusk' && <div style={{ width: 48, height: 1, backgroundColor: t.accent, marginTop: 16 }} />}
          {t.layout === 'classic' && <div style={{ borderTop: `1px solid ${t.border || '#E0E0E0'}`, margin: '20px 0' }} />}
        </div>
        {enabled.map(s => renderSection(s))}
      </div>

      <div style={{ backgroundColor: t.footerBg, padding: '20px 36px', textAlign: 'center' }}>
        <div style={{ color: t.footerText, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{c.footerName}</div>
        <div style={{ color: t.footerText, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>{c.footerAddress}</div>
        <div style={{ color: t.footerText, fontSize: 11, opacity: 0.55, marginTop: 10 }}>{c.footerCopyright}</div>
      </div>
    </div>
  )
}

// ─── Template editor ──────────────────────────────────────────────────────────

function Accordion({ title, icon: Icon, open, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left cursor-pointer border-0 outline-none bg-transparent hover:bg-ink/[0.04] transition-colors"
      >
        <Icon size={14} className="text-muted flex-shrink-0" strokeWidth={1.8} />
        <span className="font-sans text-[13px] text-ink flex-1">{title}</span>
        <ChevronRight size={13} className={`text-muted transition-transform duration-150 flex-shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-4 pb-3 space-y-4 pt-0.5">{children}</div>}
    </div>
  )
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <p className="font-sans text-[10px] text-muted uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function SegCtrl({ options, value, onChange }) {
  return (
    <div className="flex bg-canvas rounded-lg border border-line p-0.5">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 rounded-md font-sans text-[11px] cursor-pointer border-0 outline-none transition-all ${value === o.value ? 'bg-white text-ink shadow-sm font-medium' : 'text-muted hover:text-secondary'}`}
        >{o.label}</button>
      ))}
    </div>
  )
}

function Inp({ label, value, onChange, placeholder, rows }) {
  return (
    <div>
      {label && <p className="font-sans text-[10px] text-muted mb-1">{label}</p>}
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
          className="w-full px-2.5 py-2 font-sans text-[12px] text-ink border border-line rounded-lg outline-none focus:border-ink/30 transition bg-white resize-none leading-relaxed" />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-2.5 py-1.5 font-sans text-[12px] text-ink border border-line rounded-lg outline-none focus:border-ink/30 transition bg-white" />
      )}
    </div>
  )
}

export function TemplateEditor({ template, customization, onSave, onBack, logoUrl, caseData }) {
  const { canWrite } = useUser()
  const [openPanels, setOpenPanels] = useState(new Set(['body']))
  const [sections, setSections] = useState(
    customization?.sections || DEFAULT_SECTIONS.map(s => ({ ...s }))
  )
  const [colors, setColors] = useState({
    headerBg: template.headerBg, headerText: template.headerText,
    bg: template.bg, cardBg: template.cardBg, accent: template.accent,
    text: template.text, muted: template.muted, progressActive: template.progressActive,
    border: template.border, footerBg: template.footerBg, footerText: template.footerText,
    ...customization?.colors,
  })
  const [font, setFont] = useState(customization?.font || template.font)
  const [fontSize, setFontSize] = useState(customization?.fontSize || 13)
  const [headingSize, setHeadingSize] = useState(customization?.headingSize || 22)
  const [headingColor, setHeadingColor] = useState(customization?.headingColor || template.text)
  const [message, setMessage] = useState(customization?.message || SAMPLE.message)
  const [greeting, setGreeting] = useState(customization?.greeting || '')
  const [progressLabels, setProgressLabels] = useState(
    customization?.progressLabels || [...DEFAULT_PROGRESS_LABELS]
  )
  const [buttonLabel, setButtonLabel] = useState(customization?.buttonLabel || 'Contact')
  const [footerName, setFooterName] = useState(customization?.footerName || SAMPLE.funeralHome)
  const [footerTagline, setFooterTagline] = useState(customization?.footerTagline || SAMPLE.tagline)
  const [footerAddress, setFooterAddress] = useState(customization?.footerAddress || '123 Memorial Lane · San Francisco · (415) 555-0100')
  const [footerCopyright, setFooterCopyright] = useState(customization?.footerCopyright || `© 2024 ${SAMPLE.funeralHome} · Unsubscribe`)
  const [saveState, setSaveState] = useState('idle')

  const merged = { ...template, ...colors, font }
  const config = {
    fontSize, headingSize, headingColor, message, greeting,
    progressLabels, buttonLabel, buttonRadius: 8, cardRadius: 10,
    footerName, footerTagline, footerAddress, footerCopyright,
  }

  function togglePanel(id) {
    setOpenPanels(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function updateColor(key, val) {
    setColors(prev => { const next = { ...prev, [key]: val }; if (key === 'accent') next.progressActive = val; return next })
  }

  function updateProgressLabel(idx, val) {
    setProgressLabels(prev => { const n = [...prev]; n[idx] = val; return n })
  }

  function handleSave() {
    onSave({ sections, colors, font, fontSize, headingSize, headingColor, message, greeting, progressLabels, buttonLabel, footerName, footerTagline, footerAddress, footerCopyright })
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  function handleReset() {
    setSections(DEFAULT_SECTIONS.map(s => ({ ...s })))
    setColors({ headerBg: template.headerBg, headerText: template.headerText, bg: template.bg, cardBg: template.cardBg, accent: template.accent, text: template.text, muted: template.muted, progressActive: template.progressActive, border: template.border, footerBg: template.footerBg, footerText: template.footerText })
    setFont(template.font); setFontSize(13); setHeadingSize(22); setHeadingColor(template.text)
    setMessage(SAMPLE.message); setGreeting(''); setProgressLabels([...DEFAULT_PROGRESS_LABELS]); setButtonLabel('Contact')
    setFooterName(SAMPLE.funeralHome); setFooterTagline(SAMPLE.tagline)
    setFooterAddress('123 Memorial Lane · San Francisco · (415) 555-0100')
    setFooterCopyright(`© 2024 ${SAMPLE.funeralHome} · Unsubscribe`)
  }

  const progressEnabled = sections.find(s => s.id === 'progress')?.enabled

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="border-b border-line bg-surface/80 backdrop-blur shrink-0 z-10">
        <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-sans text-[11.5px] text-muted mb-1.5" />
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-secondary hover:text-ink hover:border-ink/30 transition-colors cursor-pointer outline-none">
                <ChevronLeft size={16} />
              </button>
              <PageTitle className="leading-none">Edit · {template.name}</PageTitle>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {canWrite && <>
              <button onClick={handleReset} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line bg-white font-sans text-[12.5px] text-secondary hover:text-ink hover:border-ink/30 transition-colors cursor-pointer outline-none">
                <RotateCcw size={13} /> Reset
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-ink text-surface font-sans text-[12.5px] font-medium cursor-pointer border-0 outline-none hover:bg-ink/90 transition-colors">
                {saveState === 'saved' && <Check size={13} />}
                {saveState === 'saved' ? 'Saved' : 'Save Changes'}
              </button>
            </>}
          </div>
        </div>
        <div className="px-6 pb-3 flex items-end gap-2">
          <div className="h-9 flex items-center">
            <span className="font-sans text-[12.5px] text-muted">Click a section to expand</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="w-[300px] flex-shrink-0 border-r border-line bg-surface overflow-auto">
          <div className="py-2">

            {/* ── Header ── */}
            <Accordion title="Header" icon={PanelTop} open={openPanels.has('header')} onToggle={() => togglePanel('header')}>
              <FieldGroup label="Branding">
                <div className="space-y-2">
                  <Inp label="Company name" value={footerName} onChange={setFooterName} />
                  <Inp label="Tagline" value={footerTagline} onChange={setFooterTagline} />
                </div>
              </FieldGroup>
              <FieldGroup label="Colours">
                <div className="space-y-2">
                  <ColorField label="Background" value={colors.headerBg} onChange={v => updateColor('headerBg', v)} />
                  <ColorField label="Text" value={colors.headerText} onChange={v => updateColor('headerText', v)} />
                </div>
              </FieldGroup>
            </Accordion>

            {/* ── Body ── */}
            <Accordion title="Body" icon={AlignLeft} open={openPanels.has('body')} onToggle={() => togglePanel('body')}>
              <FieldGroup label="Sections · drag to reorder">
                <SectionList sections={sections} onChange={setSections} />
              </FieldGroup>

              {progressEnabled && (
                <FieldGroup label="Progress step labels">
                  <div className="space-y-1.5">
                    {progressLabels.map((label, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${i <= STATUS_ORDER.indexOf(SAMPLE.status) ? 'bg-primary/20 text-primary' : 'bg-line text-muted'}`}>{i + 1}</span>
                        <input type="text" value={label} onChange={e => updateProgressLabel(i, e.target.value)}
                          className="flex-1 px-2 py-1 font-sans text-[12px] text-ink border border-line rounded-lg outline-none focus:border-ink/30 transition bg-white" />
                      </div>
                    ))}
                  </div>
                </FieldGroup>
              )}

              <FieldGroup label="Typography">
                <div className="space-y-2.5">
                  <div>
                    <p className="font-sans text-[10px] text-muted mb-1">Font</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FONT_OPTIONS.map(opt => (
                        <button key={opt.label} onClick={() => setFont(opt.value)}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] cursor-pointer outline-none transition-all ${font === opt.value ? 'border-ink bg-ink text-surface font-medium' : 'border-line text-secondary hover:border-ink bg-white'}`}
                          style={{ fontFamily: opt.value }}
                        >{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-sans text-[10px] text-muted mb-1">Body size</p>
                    <SegCtrl options={FONT_SIZES} value={fontSize} onChange={setFontSize} />
                  </div>
                  <div>
                    <p className="font-sans text-[10px] text-muted mb-1">Heading size</p>
                    <SegCtrl options={HEADING_SIZES} value={headingSize} onChange={setHeadingSize} />
                  </div>
                  <ColorField label="Heading colour" value={headingColor} onChange={setHeadingColor} />
                </div>
              </FieldGroup>

              <FieldGroup label="Content">
                <div className="space-y-2">
                  <Inp label="Greeting (leave empty for family name)" value={greeting} onChange={setGreeting} placeholder={SAMPLE.family} />
                  <Inp label="Personal message" value={message} onChange={setMessage} rows={4} />
                  <Inp label="Button text" value={buttonLabel} onChange={setButtonLabel} placeholder="Contact" />
                </div>
              </FieldGroup>

              <FieldGroup label="Colours">
                <div className="space-y-2">
                  <ColorField label="Background" value={colors.bg} onChange={v => updateColor('bg', v)} />
                  <ColorField label="Cards" value={colors.cardBg} onChange={v => updateColor('cardBg', v)} />
                  <ColorField label="Accent" value={colors.accent} onChange={v => updateColor('accent', v)} />
                  <ColorField label="Text" value={colors.text} onChange={v => updateColor('text', v)} />
                  <ColorField label="Muted text" value={colors.muted} onChange={v => updateColor('muted', v)} />
                </div>
              </FieldGroup>
            </Accordion>

            {/* ── Footer ── */}
            <Accordion title="Footer" icon={PanelBottom} open={openPanels.has('footer')} onToggle={() => togglePanel('footer')}>
              <FieldGroup label="Content">
                <div className="space-y-2">
                  <Inp label="Address & phone" value={footerAddress} onChange={setFooterAddress} />
                  <Inp label="Copyright line" value={footerCopyright} onChange={setFooterCopyright} />
                </div>
              </FieldGroup>
              <FieldGroup label="Colours">
                <div className="space-y-2">
                  <ColorField label="Background" value={colors.footerBg} onChange={v => updateColor('footerBg', v)} />
                  <ColorField label="Text" value={colors.footerText} onChange={v => updateColor('footerText', v)} />
                </div>
              </FieldGroup>
            </Accordion>

          </div>
        </div>

        <div className="flex-1 overflow-auto bg-canvas">
          <div className="p-8 max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="font-sans text-xs text-muted">Live Preview</p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5">
              <EditableEmailPreview template={merged} sections={sections} config={config} logoUrl={logoUrl} caseData={caseData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({ t, isActive, isFavourite, onSetActive, onToggleFavourite, onPreview, onEdit, caseMode }) {
  return (
    <div
      onClick={() => onPreview(t)}
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isActive
          ? 'ring-2 ring-offset-2 ring-primary shadow-lg shadow-primary/10'
          : 'border border-line hover:shadow-[0_8px_24px_-6px_rgba(28,28,30,0.15)] hover:-translate-y-0.5'
      }`}
    >
      {isActive && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-white font-sans text-[10px] font-semibold shadow-sm">
          <Check size={9} strokeWidth={3} />
          Active
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); onToggleFavourite(t.id) }}
        className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border-0 outline-none ${
          isFavourite
            ? 'bg-amber-50 text-amber-500 shadow-sm'
            : 'opacity-0 group-hover:opacity-100 bg-black/25 text-white hover:bg-black/40'
        }`}
        title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      >
        <Star size={12} className={isFavourite ? '[&_*]:fill-current' : ''} />
      </button>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
        <button
          onClick={e => { e.stopPropagation(); onPreview(t) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-ink font-sans text-xs font-medium shadow-md cursor-pointer border-0 outline-none hover:bg-white/90 transition-colors"
        >
          <Eye size={12} />
          Preview
        </button>
        {onEdit && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(t) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-ink font-sans text-xs font-medium shadow-md cursor-pointer border-0 outline-none hover:bg-white/90 transition-colors"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
        {caseMode && !isActive && (
          <button
            onClick={e => { e.stopPropagation(); onSetActive(t.id) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-sans text-xs font-medium shadow-md cursor-pointer border-0 outline-none hover:bg-primary/90 transition-colors"
          >
            <Check size={12} />
            Set Active
          </button>
        )}
      </div>

      <div className="p-3">
        <TemplateThumbnail t={t} />
      </div>

      <div className="border-t border-line/50 bg-white px-3 pb-3 pt-2">
        <div className="font-sans font-semibold text-[13px] text-ink">{t.name}</div>
        <div className="font-sans text-[11px] text-muted">{t.tagline}</div>
      </div>
    </div>
  )
}

// ─── Preview modal ────────────────────────────────────────────────────────────

export function PreviewModal({ t, isActive, isFavourite, onSetActive, onToggleFavourite, onClose, onEdit, logoUrl, caseMode, customization, caseData }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const c = customization || {}
  const hasCustomization = !!customization
  const merged = { ...t, ...(c.colors || {}), font: c.font || t.font }
  const previewConfig = {
    fontSize: c.fontSize || 13,
    headingSize: c.headingSize || 22,
    headingColor: c.headingColor || t.text,
    message: c.message || SAMPLE.message,
    greeting: c.greeting || '',
    progressLabels: c.progressLabels || [...DEFAULT_PROGRESS_LABELS],
    buttonLabel: c.buttonLabel || 'Contact',
    buttonRadius: 8,
    cardRadius: 10,
    footerName: c.footerName || SAMPLE.funeralHome,
    footerTagline: c.footerTagline || SAMPLE.tagline,
    footerAddress: c.footerAddress || '123 Memorial Lane · San Francisco · (415) 555-0100',
    footerCopyright: c.footerCopyright || `© 2024 ${SAMPLE.funeralHome} · Unsubscribe`,
  }
  const sections = c.sections || DEFAULT_SECTIONS

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col bg-canvas rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0 bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-sans font-semibold text-[15px] text-ink">{t.name}</p>
              {isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-sans text-[10px] font-semibold">
                  <Check size={9} strokeWidth={3} /> Active
                </span>
              )}
              {hasCustomization && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-light text-warning font-sans text-[10px] font-semibold">
                  Customised
                </span>
              )}
            </div>
            <p className="font-sans text-xs text-muted mt-0.5">{t.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavourite(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-sans text-xs font-medium transition-all cursor-pointer outline-none ${
                isFavourite
                  ? 'border-amber-300 bg-amber-50 text-amber-600'
                  : 'border-line text-secondary hover:border-ink hover:text-ink'
              }`}
            >
              <Star size={12} className={isFavourite ? '[&_*]:fill-current' : ''} />
              {isFavourite ? 'Favourited' : 'Favourite'}
            </button>
            {onEdit && (
              <button
                onClick={() => { onClose(); onEdit(t) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line font-sans text-xs font-medium text-secondary hover:text-ink hover:border-ink/30 transition-all cursor-pointer outline-none"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
            {caseMode && !isActive && (
              <button
                onClick={() => { onSetActive(t.id); onClose() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-sans text-xs font-medium cursor-pointer border-0 outline-none hover:bg-primary/90 transition-colors"
              >
                <Check size={12} />
                Set as Active
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-line/50 transition-colors cursor-pointer border-0 outline-none bg-transparent"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-canvas">
          <div className="p-6">
            <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5">
              <EditableEmailPreview template={merged} sections={sections} config={previewConfig} logoUrl={logoUrl} caseData={caseData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Favourites row ───────────────────────────────────────────────────────────

function FavouritesRow({ templates, favouriteIds, activeId, onSetActive, onToggleFavourite, onPreview, onEdit, caseMode }) {
  const favourites = templates.filter(t => favouriteIds.includes(t.id))

  return (
    <div className="px-6 pt-5 pb-2">
      <p className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">Favourites</p>
      {favourites.length === 0 ? (
        <div className="h-20 rounded-xl border border-dashed border-line flex items-center justify-center">
          <p className="font-sans text-sm text-muted">Star a template to pin it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {favourites.map(t => (
            <TemplateCard
              key={t.id}
              t={t}
              isActive={t.id === activeId}
              isFavourite
              onSetActive={onSetActive}
              onToggleFavourite={onToggleFavourite}
              onPreview={onPreview}
              onEdit={onEdit}
              caseMode={caseMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function EmailEditorPage({ cases = [] }) {
  const { canWrite } = useUser()
  // ── Global state ──
  const [globalActiveId, setGlobalActiveId] = useState('classic')
  const [favouriteIds, setFavouriteIds] = useState([])
  const [globalCustomizations, setGlobalCustomizations] = useState({})
  const [logoUrl, setLogoUrl] = useState('')
  const [loading, setLoading] = useState(true)

  // ── Case search state ──
  const [search, setSearch] = useState('')
  const [selectedCase, setSelectedCase] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef(null)

  // ── Case-level override state ──
  const [caseActiveId, setCaseActiveId] = useState(null)
  const [caseCustomizations, setCaseCustomizations] = useState({})
  const [caseOverrideLoaded, setCaseOverrideLoaded] = useState(false)

  // ── UI state ──
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [editingId, setEditingId] = useState(null)

  // ── Derived: are we in case mode? ──
  const caseMode = !!selectedCase
  const effectiveActiveId = caseMode ? (caseActiveId ?? globalActiveId) : null
  const effectiveCustomizations = caseMode ? caseCustomizations : globalCustomizations

  // ── Load global settings + logo ──
  useEffect(() => {
    Promise.all([
      fetchEmailTemplate().catch(() => null),
      fetchPortalSettings().catch(() => null),
    ]).then(([emailData, portalData]) => {
      if (emailData) {
        setGlobalActiveId(emailData.activeTemplateId ?? 'classic')
        setFavouriteIds(emailData.favouriteIds ?? [])
        setGlobalCustomizations(emailData.customizations ?? {})
      }
      if (portalData?.logoUrl) setLogoUrl(portalData.logoUrl)
    }).finally(() => setLoading(false))
  }, [])

  // ── Load case override when a case is selected ──
  useEffect(() => {
    if (!selectedCase) { setCaseOverrideLoaded(false); return }
    setCaseOverrideLoaded(false)
    fetchEmailOverride(selectedCase.id)
      .then(data => {
        if (data?.overrides) {
          setCaseActiveId(data.overrides.activeTemplateId ?? null)
          setCaseCustomizations(data.overrides.customizations ?? {})
        } else {
          setCaseActiveId(null)
          setCaseCustomizations({})
        }
      })
      .catch(() => { setCaseActiveId(null); setCaseCustomizations({}) })
      .finally(() => setCaseOverrideLoaded(true))
  }, [selectedCase?.id])

  // ── Close dropdown on outside click ──
  useEffect(() => {
    if (!showDropdown) return
    const h = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showDropdown])

  // ── Search filtering — ranked, 1-char minimum ──
  const searchResults = (() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    const words = q.split(/\s+/).filter(Boolean)

    return cases
      .map(c => {
        const deceased = (c.deceased || '').toLowerCase()
        const family = (c.family || '').toLowerCase()
        const id = (c.id || '').toLowerCase()
        const status = (c.status || '').toLowerCase()
        const pkg = (c.package || '').toLowerCase()
        let score = 0

        for (const w of words) {
          if (deceased.startsWith(w)) score += 10
          else if (deceased.includes(w)) score += 6
          if (family.startsWith(w)) score += 8
          else if (family.includes(w)) score += 4
          if (id.startsWith(w) || id.includes(w)) score += 5
          if (status.startsWith(w)) score += 3
          if (pkg.toLowerCase().startsWith(w)) score += 2
          const nameParts = deceased.split(/\s+/)
          if (nameParts.some(p => p.startsWith(w))) score += 7
        }

        return { c, score }
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(r => r.c)
  })()

  // ── Persist: global ──
  function persistGlobal(overrides = {}) {
    const payload = {
      activeTemplateId: overrides.activeTemplateId ?? globalActiveId,
      favouriteIds: overrides.favouriteIds ?? favouriteIds,
      customizations: overrides.customizations ?? globalCustomizations,
    }
    saveEmailTemplate(payload).catch(() => {})
  }

  // ── Persist: case override ──
  function persistCaseOverride(overrides = {}) {
    if (!selectedCase) return
    const payload = {
      activeTemplateId: overrides.activeTemplateId !== undefined ? overrides.activeTemplateId : caseActiveId,
      customizations: overrides.customizations !== undefined ? overrides.customizations : caseCustomizations,
    }
    saveEmailOverride(selectedCase.id, payload).catch(() => {})
  }

  // ── Handlers: adapt to mode ──
  function handleSetActive(id) {
    if (caseMode) {
      setCaseActiveId(id)
      persistCaseOverride({ activeTemplateId: id })
    } else {
      setGlobalActiveId(id)
      persistGlobal({ activeTemplateId: id })
    }
  }

  function toggleFavourite(id) {
    const next = favouriteIds.includes(id) ? favouriteIds.filter(f => f !== id) : [...favouriteIds, id]
    setFavouriteIds(next)
    persistGlobal({ favouriteIds: next })
  }

  function handleEdit(t) { if (canWrite) setEditingId(t.id) }

  function handleSaveCustomization(data) {
    if (caseMode) {
      const next = { ...caseCustomizations, [editingId]: data }
      setCaseCustomizations(next)
      persistCaseOverride({ customizations: next })
    } else {
      const next = { ...globalCustomizations, [editingId]: data }
      setGlobalCustomizations(next)
      persistGlobal({ customizations: next })
    }
  }

  function handleSelectCase(c) {
    setSelectedCase(c)
    setSearch(c.deceased || c.family || c.id)
    setShowDropdown(false)
  }

  function handleClearCase() {
    setSelectedCase(null)
    setSearch('')
    setCaseActiveId(null)
    setCaseCustomizations({})
  }

  // ── Build case data for preview/editor ──
  const activeCaseData = selectedCase ? {
    deceased: selectedCase.deceased || SAMPLE.deceased,
    family: selectedCase.family || SAMPLE.family,
    status: selectedCase.status || SAMPLE.status,
    package: selectedCase.package || selectedCase.packageName || SAMPLE.package,
    date: selectedCase.date || SAMPLE.date,
    coordinator: selectedCase.coordinator || SAMPLE.coordinator,
    coordinatorPhone: selectedCase.coordinatorPhone || SAMPLE.coordinatorPhone,
    documents: (selectedCase.documents || []).length > 0
      ? selectedCase.documents.map(d => typeof d === 'string' ? d : d.name || d.file_name || 'Document')
      : SAMPLE.documents,
  } : null

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-sans text-sm text-muted">Loading email settings…</p>
      </div>
    )
  }

  // ── Editor view ──
  if (editingId) {
    const template = TEMPLATES.find(t => t.id === editingId)
    return (
      <TemplateEditor
        template={template}
        customization={effectiveCustomizations[editingId]}
        onSave={handleSaveCustomization}
        onBack={() => setEditingId(null)}
        logoUrl={logoUrl}
        caseData={activeCaseData}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {previewTemplate && (
        <PreviewModal
          t={previewTemplate}
          isActive={caseMode ? previewTemplate.id === effectiveActiveId : false}
          isFavourite={favouriteIds.includes(previewTemplate.id)}
          onSetActive={canWrite ? id => { handleSetActive(id); setPreviewTemplate(null) } : undefined}
          onToggleFavourite={canWrite ? toggleFavourite : undefined}
          onClose={() => setPreviewTemplate(null)}
          onEdit={canWrite ? handleEdit : undefined}
          logoUrl={logoUrl}
          caseMode={caseMode}
          customization={effectiveCustomizations[previewTemplate.id] || null}
          caseData={activeCaseData}
        />
      )}

      {/* ── Top bar ── */}
      <div className="border-b border-line bg-surface/80 backdrop-blur shrink-0 relative z-30">
        <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-sans text-[11.5px] text-muted mb-1.5" />
            <div className="flex items-baseline gap-3">
              <PageTitle className="leading-none">Email Templates</PageTitle>
              <span className="font-sans text-[12.5px] text-muted">{TEMPLATES.length} templates</span>
            </div>
          </div>
        </div>

        {/* ── Search row — identical to CasesTopBar ── */}
        <div className="px-6 pb-3 flex items-end justify-between gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm" ref={searchRef}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); if (!e.target.value) handleClearCase() }}
              onFocus={() => { if (search.trim().length >= 2) setShowDropdown(true) }}
              placeholder="Search case to set its template…"
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-line bg-white text-[13px] text-ink font-sans placeholder:text-muted outline-none focus:border-ink/60 transition"
            />
            {selectedCase && (
              <button onClick={handleClearCase} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-muted hover:text-ink cursor-pointer border-0 outline-none bg-transparent">
                <X size={13} />
              </button>
            )}

            {/* ── Dropdown results ── */}
            {showDropdown && !selectedCase && searchResults.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-line rounded-xl shadow-[0_12px_32px_-8px_rgba(28,28,30,0.18)] z-50 overflow-hidden max-h-[320px] overflow-auto">
                {searchResults.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer border-0 outline-none bg-transparent hover:bg-canvas/60 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-sans text-[13px] text-ink truncate">{c.deceased}</div>
                      <div className="font-sans text-[11px] text-muted truncate">{c.family} · {c.id}</div>
                    </div>
                    <span className={`font-sans text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      c.status === 'complete' ? 'bg-primary-light text-primary' :
                      c.status === 'cremation' ? 'bg-danger-tint text-danger' :
                      c.status === 'transit' ? 'bg-info-tint text-info' :
                      'bg-warning-light text-warning'
                    }`}>{c.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Context indicator ── */}
          {caseMode ? (
            <div className="flex items-center gap-2 h-9 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-info flex-shrink-0" />
              <span className="font-sans text-[12.5px] text-muted">
                Viewing template for <span className="text-ink font-medium">{selectedCase.deceased}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 h-9 shrink-0">
              <span className="font-sans text-[12.5px] text-muted">
                Editing global defaults — search a case to override its template
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto bg-white">
        {caseMode && !caseOverrideLoaded ? (
          <div className="flex items-center justify-center py-20">
            <p className="font-sans text-sm text-muted">Loading case template…</p>
          </div>
        ) : (
          <>
            <FavouritesRow
              templates={TEMPLATES}
              favouriteIds={favouriteIds}
              activeId={effectiveActiveId}
              onSetActive={canWrite ? handleSetActive : undefined}
              onToggleFavourite={canWrite ? toggleFavourite : undefined}
              onPreview={setPreviewTemplate}
              onEdit={canWrite ? handleEdit : undefined}
              caseMode={caseMode}
            />

            <div className="px-6 pt-5 pb-2">
              <p className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted">All Templates</p>
            </div>
            <div className="px-6 pb-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {TEMPLATES.map(t => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  isActive={caseMode ? t.id === effectiveActiveId : false}
                  isFavourite={favouriteIds.includes(t.id)}
                  onSetActive={canWrite ? handleSetActive : undefined}
                  onToggleFavourite={canWrite ? toggleFavourite : undefined}
                  onPreview={setPreviewTemplate}
                  onEdit={canWrite ? handleEdit : undefined}
                  caseMode={caseMode}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
