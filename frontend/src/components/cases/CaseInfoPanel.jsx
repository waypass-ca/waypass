import { ArrowLeft, CalendarPlus, StickyNote, Mail, Phone, Printer } from 'lucide-react'
import { StatusPill } from '../ui/StatusPill'
import { InfoField } from '../ui/InfoField'
import { InfoSection } from '../ui/InfoSection'

export function CaseInfoPanel({ caseData, onBack, status, setActiveTab, onShowNote, onSchedule }) {
  return (
    <div className="w-[320px] flex-shrink-0 bg-white border-r border-line flex flex-col overflow-hidden">

      <div className="px-5 pt-5 pb-5 border-b border-line flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-sans text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent outline-none mb-5"
        >
          <ArrowLeft size={12} />
          Cases
        </button>
        <div className="flex flex-col items-center">
          <h2 className="font-display text-[32px] text-ink leading-snug mb-1 flex items-center">{caseData.deceased}</h2>
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={status} />
          </div>
          <p className="font-mono text-[10px] text-muted mb-2">{caseData.id}</p>

          <div className="flex justify-around">
            {[
              { icon: CalendarPlus, label: 'Schedule', onClick: onSchedule ?? (() => setActiveTab('activity')) },
              { icon: StickyNote, label: 'Note', onClick: onShowNote },
              { icon: Mail, label: 'Email', onClick: () => {} },
              { icon: Phone, label: 'Call', onClick: () => {} },
              { icon: Printer, label: 'Print', onClick: () => window.print() },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-center gap-1.5 mx-1.5 cursor-pointer border-0 bg-transparent outline-none group"
              >
                <div className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center group-hover:bg-line transition-colors">
                  <Icon size={14} strokeWidth={1.6} className="text-secondary group-hover:text-ink transition-colors" />
                </div>
                <span className="font-sans text-[9px] text-muted group-hover:text-ink transition-colors leading-none">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <InfoSection title="Deceased Details">
          <InfoField label="Date of Birth" value={caseData.dob} />
          <InfoField label="Date of Passing" value={caseData.dop} />
          <InfoField label="Location" value={caseData.location} />
        </InfoSection>

        <InfoSection title="Family Contact">
          <InfoField label="Name" value={caseData.contactName} />
          <InfoField label="Relationship" value={caseData.relationship} />
          <InfoField label="Phone" value={caseData.contactPhone} />
          <InfoField label="Email" value={caseData.contactEmail} />
        </InfoSection>

        <InfoSection title="Arrangements">
          <InfoField label="Package" value={caseData.package} />
          <InfoField label="Add-ons" value={caseData.addons?.join(', ') || 'None'} />
          <InfoField label="Crematorium" value={caseData.crematorium} />
          <div className="flex items-baseline justify-between py-3 mt-1">
            <span className="font-sans text-[10px] text-muted uppercase tracking-wide">Total</span>
            <span className="font-display text-xl text-ink">${caseData.amount?.toLocaleString()}</span>
          </div>
        </InfoSection>
      </div>
    </div>
  )
}
