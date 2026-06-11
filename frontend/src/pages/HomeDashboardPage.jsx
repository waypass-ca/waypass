import { useState, useEffect } from 'react'
import { Clock, TriangleAlert, ChartColumnBig, FolderOpen, Plus } from 'lucide-react'
import { StatusPill } from '../components/ui/StatusPill'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { fetchInbox } from '../lib/api.js'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_COLORS = {
  pending:   'text-warning',
  transit:   'text-info',
  cremation: 'text-danger',
  complete:  'text-primary',
}

function RecentCaseCard({ caseData, onClick }) {
  const iconColor = STATUS_COLORS[caseData.status] ?? 'text-muted'
  return (
    <button
      onClick={onClick}
      className="w-[148px] flex-shrink-0 bg-surface border border-line rounded-xl p-4 text-left hover:border-ink/20 hover:shadow-sm transition-all cursor-pointer outline-none group"
    >
      <div className="mb-3">
        <FolderOpen size={22} className={`${iconColor} opacity-80`} strokeWidth={1.5} />
      </div>
      <p className="font-sans text-[13px] font-semibold text-ink leading-tight truncate mb-1">
        {caseData.deceased}
      </p>
      <p className="font-sans text-[11px] text-muted truncate mb-2">{caseData.family}</p>
      <StatusPill status={caseData.status} />
    </button>
  )
}

const SEV_DOT = { danger: 'bg-danger', warning: 'bg-warning', info: 'bg-info' }
const SEV_BADGE = { danger: 'red', warning: 'warning', info: 'blue' }
const SEV_LABEL = { danger: 'Critical', warning: 'Warning', info: 'Info' }

function AlertRow({ item, onClick }) {
  const sev = item.severity ?? 'info'
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-3 border-b border-line last:border-0 text-left hover:bg-canvas transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${SEV_DOT[sev] ?? 'bg-info'}`} />
        <div>
          <p className="font-sans text-sm font-medium text-ink">{item.subject}</p>
          <p className="font-sans text-[11px] text-muted mt-0.5">
            {item.from}{item.caseId ? ` · ${item.caseId}` : ''}
          </p>
        </div>
      </div>
      <Badge variant={SEV_BADGE[sev] ?? 'blue'}>{SEV_LABEL[sev] ?? 'Info'}</Badge>
    </button>
  )
}

const BAR_DATA = [
  { month: 'Jan', pct: 58, value: '$4,210' },
  { month: 'Feb', pct: 72, value: '$5,890' },
  { month: 'Mar', pct: 100, value: '$8,475' },
]

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={13} className="text-muted" strokeWidth={2} />
      <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-widest">{children}</span>
    </div>
  )
}

export function HomeDashboardPage({ cases, onViewCase, onNewCase, onViewInbox }) {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    fetchInbox()
      .then(items => setAlerts(items.filter(i => i.type === 'alert')))
      .catch(console.error)
  }, [])

  const hasCritical = alerts.some(a => a.severity === 'danger')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center pt-10 pb-12">
        <h1 className="font-display text-5xl font-light text-ink tracking-tight">
          {getGreeting()}
        </h1>
        <p className="font-sans text-sm text-muted mt-3">
          {alerts.length > 0
            ? `${alerts.length} alert${alerts.length > 1 ? 's' : ''} across your cases.`
            : 'Everything is on track — no alerts.'}
        </p>
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-muted" strokeWidth={2} />
            <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-widest">Recent Cases</span>
          </div>
          <button
            onClick={onNewCase}
            className="flex items-center gap-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans hover:bg-info hover:text-info-tint bg-info-tint text-info transition-colors"
          >
            <Plus size={13} strokeWidth={2} />
            New case
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hidden">
          {cases.slice(0, 6).map(c => (
            <RecentCaseCard key={c.id} caseData={c} onClick={() => onViewCase(c.id)} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TriangleAlert size={13} className="text-muted" strokeWidth={2} />
            <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-widest">Alerts</span>
          </div>
          {alerts.length > 0 && (
            <Badge variant={hasCritical ? 'red' : 'warning'}>{alerts.length} flagged</Badge>
          )}
        </div>
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          {alerts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-sans text-sm text-muted">No new alerts — all clear.</p>
            </div>
          ) : (
            alerts.map(a => (
              <AlertRow key={a.id} item={a} onClick={() => onViewInbox?.(a.id)} />
            ))
          )}
        </div>
      </section>

      <section>
        <SectionLabel icon={ChartColumnBig}>Stats &amp; Revenue</SectionLabel>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Active Cases',          value: '4',      sub: '↑ 1 from last week' },
            { label: 'This Month Revenue',    value: '$7,225', sub: '↑ 18% vs February' },
            { label: 'Cases YTD',             value: '31',     sub: '↑ 34% vs last year' },
            { label: 'Pending Authorization', value: '2',      sub: 'Auth form or permit missing' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface border border-line rounded-xl px-4 py-4">
              <p className="font-sans text-[11px] text-muted uppercase tracking-wide mb-2">{stat.label}</p>
              <p className="font-display text-3xl font-light text-ink leading-none">{stat.value}</p>
              <p className="font-sans text-[11px] text-muted mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-line rounded-xl p-5">
            <p className="font-sans text-[11px] text-muted uppercase tracking-wide mb-1">Monthly Revenue</p>
            <p className="font-display text-xl text-ink mb-6">2024 Overview</p>
            <div className="flex items-end gap-4" style={{ height: '100px' }}>
              {BAR_DATA.map(bar => (
                <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="font-sans text-[10px] text-muted">{bar.value}</span>
                  <div
                    className="w-full rounded-t-md bg-primary opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${bar.pct}%` }}
                  />
                  <span className="font-sans text-[10px] text-muted">{bar.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-line rounded-xl p-5">
            <p className="font-sans text-[11px] text-muted uppercase tracking-wide mb-1">Revenue Recaptured</p>
            <p className="font-display text-4xl font-light text-ink mt-1">$18,575</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-sans text-sm text-primary font-medium">↑ 34%</span>
              <span className="font-sans text-xs text-muted">vs outsourcing to third party</span>
            </div>
            <div className="mt-5 pt-4 border-t border-line space-y-2.5">
              {[
                { label: 'Cases handled in-house', value: '31 YTD' },
                { label: 'Avg. margin per case',   value: '$599' },
                { label: 'Avg. turnaround',        value: '2.4 days' },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="font-sans text-xs text-muted">{r.label}</span>
                  <span className="font-sans text-xs font-medium text-ink">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
