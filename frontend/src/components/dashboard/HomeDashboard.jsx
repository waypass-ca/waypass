import { Clock, TriangleAlert, ChartColumnBig, FolderOpen, Plus } from 'lucide-react'
import { StatusPill } from '../ui/StatusPill'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const STATUS_COLORS = {
  pending:   'text-amber',
  transit:   'text-blue-soft',
  cremation: 'text-red-soft',
  complete:  'text-sage',
}

function RecentCaseCard({ caseData, onClick }) {
  const iconColor = STATUS_COLORS[caseData.status] ?? 'text-muted'
  return (
    <button
      onClick={onClick}
      className="w-[148px] flex-shrink-0 bg-warm-white border border-border rounded-xl p-4 text-left hover:border-charcoal/20 hover:shadow-sm transition-all cursor-pointer outline-none group"
    >
      <div className="mb-3">
        <FolderOpen size={22} className={`${iconColor} opacity-80`} strokeWidth={1.5} />
      </div>
      <p className="font-sans text-[13px] font-semibold text-charcoal leading-tight truncate mb-1">
        {caseData.deceased}
      </p>
      <p className="font-sans text-[11px] text-muted truncate mb-2">{caseData.family}</p>
      <StatusPill status={caseData.status} />
    </button>
  )
}


const MOCK_ALERTS = [
  { caseId: 'CASE-2024-031', deceasedName: 'Margaret H. Caldwell', reason: 'Authorization unsigned — Day 3', severity: 'critical' },
  { caseId: 'CASE-2024-029', deceasedName: 'Robert A. Nguyen',     reason: 'No crematory confirmation — 18 hrs', severity: 'critical' },
  { caseId: 'CASE-2024-027', deceasedName: 'Eleanor J. Park',      reason: 'Cremation permit not uploaded', severity: 'warning' },
  { caseId: 'CASE-2024-025', deceasedName: 'Thomas W. Brennan',    reason: 'Death certificate pending — Day 2', severity: 'warning' },
]

function AlertRow({ caseId, deceasedName, reason, severity }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${severity === 'critical' ? 'bg-red-soft' : 'bg-amber'}`} />
        <div>
          <p className="font-sans text-sm font-medium text-charcoal">{deceasedName}</p>
          <p className="font-sans text-[11px] text-muted mt-0.5">{caseId}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-sans text-sm text-slate">{reason}</p>
        <Badge variant={severity === 'critical' ? 'red' : 'amber'}>
          {severity === 'critical' ? 'Critical' : 'Warning'}
        </Badge>
      </div>
    </div>
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

export function HomeDashboard({ cases, onViewCase, onNewCase }) {
  const alerts = MOCK_ALERTS
  const hasCritical = alerts.some(a => a.severity === 'critical')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="text-center pt-10 pb-12">
        <h1 className="font-display text-5xl font-light text-charcoal tracking-tight">
          {getGreeting()}
        </h1>
        <p className="font-sans text-sm text-muted mt-3">
          {alerts.length > 0
            ? `${alerts.length} case${alerts.length > 1 ? 's' : ''} need your attention today.`
            : 'Everything is on track — no alerts.'}
        </p>
      </div>

      {/* Recent Cases */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          {/* <SectionLabel icon={Clock}>Recent Cases</SectionLabel> */}
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-muted" strokeWidth={2} />
            <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-widest">Recent Cases</span>
          </div>
          <button
            onClick={onNewCase}
            className="flex items-center gap-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans hover:bg-blue-soft hover:text-blue-light bg-blue-light text-blue-soft transition-colors"
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

      {/* Alerts */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TriangleAlert size={13} className="text-muted" strokeWidth={2} />
            <span className="font-sans text-[11px] font-semibold text-muted uppercase tracking-widest">Alerts</span>
          </div>
          {alerts.length > 0 && (
            <Badge variant={hasCritical ? 'red' : 'amber'}>{alerts.length} flagged</Badge>
          )}
        </div>
        <div className="bg-warm-white border border-border rounded-xl px-5 py-1">
          {alerts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-sans text-sm text-muted">No flagged cases — all clear.</p>
            </div>
          ) : (
            alerts.map(a => <AlertRow key={a.caseId} {...a} />)
          )}
        </div>
      </section>

      {/* Stats & Revenue */}
      <section>
        <SectionLabel icon={ChartColumnBig}>Stats &amp; Revenue</SectionLabel>

        {/* Stat numbers row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Active Cases',          value: '4',      sub: '↑ 1 from last week' },
            { label: 'This Month Revenue',    value: '$7,225', sub: '↑ 18% vs February' },
            { label: 'Cases YTD',             value: '31',     sub: '↑ 34% vs last year' },
            { label: 'Pending Authorization', value: '2',      sub: 'Auth form or permit missing' },
          ].map(stat => (
            <div key={stat.label} className="bg-warm-white border border-border rounded-xl px-4 py-4">
              <p className="font-sans text-[11px] text-muted uppercase tracking-wide mb-2">{stat.label}</p>
              <p className="font-display text-3xl font-light text-charcoal leading-none">{stat.value}</p>
              <p className="font-sans text-[11px] text-muted mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Bar chart */}
          <div className="bg-warm-white border border-border rounded-xl p-5">
            <p className="font-sans text-[11px] text-muted uppercase tracking-wide mb-1">Monthly Revenue</p>
            <p className="font-display text-xl text-charcoal mb-6">2024 Overview</p>
            <div className="flex items-end gap-4" style={{ height: '100px' }}>
              {BAR_DATA.map(bar => (
                <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="font-sans text-[10px] text-muted">{bar.value}</span>
                  <div
                    className="w-full rounded-t-md bg-sage opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${bar.pct}%` }}
                  />
                  <span className="font-sans text-[10px] text-muted">{bar.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue recaptured */}
          <div className="bg-warm-white border border-border rounded-xl p-5">
            <p className="font-sans text-[11px] text-muted uppercase tracking-wide mb-1">Revenue Recaptured</p>
            <p className="font-display text-4xl font-light text-charcoal mt-1">$18,575</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-sans text-sm text-sage font-medium">↑ 34%</span>
              <span className="font-sans text-xs text-muted">vs outsourcing to third party</span>
            </div>
            <div className="mt-5 pt-4 border-t border-border space-y-2.5">
              {[
                { label: 'Cases handled in-house', value: '31 YTD' },
                { label: 'Avg. margin per case',   value: '$599' },
                { label: 'Avg. turnaround',        value: '2.4 days' },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="font-sans text-xs text-muted">{r.label}</span>
                  <span className="font-sans text-xs font-medium text-charcoal">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
