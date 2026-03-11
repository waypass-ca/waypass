import { ProgressTrack } from '../ui/ProgressTrack'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const CTA_MAP = {
  0: { label: 'Accept Order', variant: 'sage' },
  1: { label: 'Begin Cremation', variant: 'primary' },
  2: { label: 'Mark Complete', variant: 'primary' },
  3: { label: 'Complete', variant: 'secondary' },
}

export function OrderCard({ order, onAdvance }) {
  const cta = CTA_MAP[order.status] ?? CTA_MAP[0]
  const isComplete = order.status === 3

  return (
    <div className="bg-warm-white rounded-xl p-6 border border-border mb-4">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-muted">{order.id}</span>
            <Badge variant={order.tag === 'family' ? 'blue' : 'amber'}>
              {order.tag === 'family' ? 'Family Viewing' : 'Direct Order'}
            </Badge>
          </div>
          <h3 className="font-display text-2xl text-charcoal">{order.name}</h3>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl text-charcoal">${order.amount.toLocaleString()}</p>
          <p className="font-sans text-xs text-muted mt-0.5">Fulfillment fee</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-4 gap-4 py-4 border-t border-b border-border mb-5">
        <div>
          <p className="font-sans text-xs text-muted uppercase tracking-wide">Funeral Home</p>
          <p className="font-sans text-sm text-charcoal font-medium mt-1">{order.funeral_home}</p>
        </div>
        <div>
          <p className="font-sans text-xs text-muted uppercase tracking-wide">Package</p>
          <p className="font-sans text-sm text-charcoal font-medium mt-1">{order.package}</p>
        </div>
        <div>
          <p className="font-sans text-xs text-muted uppercase tracking-wide">Received</p>
          <p className="font-sans text-sm text-charcoal font-medium mt-1">{order.received}</p>
        </div>
        <div>
          <p className="font-sans text-xs text-muted uppercase tracking-wide">Scheduled</p>
          <p className="font-sans text-sm text-charcoal font-medium mt-1">{order.scheduled}</p>
        </div>
      </div>

      {/* Progress track */}
      <div className="mb-5">
        <ProgressTrack steps={order.steps} currentStep={order.status} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          <Button variant="secondary">View Documents</Button>
          <Button variant="secondary">Message Funeral Home</Button>
        </div>

        {isComplete ? (
          <Badge variant="sage">Complete</Badge>
        ) : (
          <Button
            variant={cta.variant}
            onClick={() => onAdvance(order.id)}
          >
            {cta.label}
          </Button>
        )}
      </div>
    </div>
  )
}
