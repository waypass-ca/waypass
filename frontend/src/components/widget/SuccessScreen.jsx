import { Badge } from '../ui/Badge'

export function SuccessScreen({ caseId }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      {/* Dove icon */}
      <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center text-2xl mb-6">
        🕊
      </div>

      {/* Heading */}
      <h2 className="font-display text-4xl font-light text-charcoal">
        Arrangements Confirmed
      </h2>

      {/* Body */}
      <p className="font-sans text-sm text-slate mt-4 max-w-sm leading-relaxed">
        Our care team will be in touch within 2 hours to guide you through the next steps.
        You will receive a confirmation email and case updates shortly.
      </p>

      {/* Case ID badge */}
      <div className="mt-6">
        <Badge variant="amber">Case #{caseId}</Badge>
      </div>

      {/* Secondary text */}
      <p className="font-sans text-xs text-muted mt-8">
        Questions? Our care team is available 24 hours, 7 days a week.
      </p>
      <p className="font-sans text-xs font-medium text-charcoal mt-1">
        (415) 555-0190
      </p>
    </div>
  )
}
