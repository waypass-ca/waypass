import { Badge } from '../ui/Badge'

const MOCK_ALERTS = [
  {
    caseId: 'CASE-2024-031',
    deceasedName: 'Margaret H. Caldwell',
    reason: 'Authorization unsigned — Day 3',
    severity: 'critical',
  },
  {
    caseId: 'CASE-2024-029',
    deceasedName: 'Robert A. Nguyen',
    reason: 'No crematory confirmation — 18 hrs',
    severity: 'critical',
  },
  {
    caseId: 'CASE-2024-027',
    deceasedName: 'Eleanor J. Park',
    reason: 'Cremation permit not uploaded',
    severity: 'warning',
  },
  {
    caseId: 'CASE-2024-025',
    deceasedName: 'Thomas W. Brennan',
    reason: 'Death certificate pending — Day 2',
    severity: 'warning',
  },
]

function AlertRow({ caseId, deceasedName, reason, severity }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
      <div className="flex items-center gap-4">
        <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${severity === 'critical' ? 'bg-red-soft' : 'bg-amber'}`} />
        <div>
          <p className="font-sans text-sm font-medium text-charcoal">{deceasedName}</p>
          <p className="font-sans text-xs text-muted mt-0.5">{caseId}</p>
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

export function OperationalAlerts({ alerts = MOCK_ALERTS }) {
  return (
    <div className="bg-warm-white rounded-xl border border-border mb-6">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="font-display text-lg text-charcoal">Operational Alerts</p>
          <p className="font-sans text-xs text-muted mt-0.5">Cases requiring immediate attention</p>
        </div>
        {alerts.length > 0 && (
          <Badge variant={alerts.some(a => a.severity === 'critical') ? 'red' : 'amber'}>
            {alerts.length} flagged
          </Badge>
        )}
      </div>

      <div className="px-5 pb-4">
        {alerts.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="font-sans text-sm text-muted">No flagged cases — all clear.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <AlertRow key={alert.caseId} {...alert} />
          ))
        )}
      </div>
    </div>
  )
}
