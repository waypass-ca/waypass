import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarPlus, StickyNote, Mail, Phone, Printer, Pencil } from 'lucide-react'
import { StatusPill } from '../ui/StatusPill'
import { InfoSection } from '../ui/InfoSection'
import { fetchAddons } from '../../lib/api.js'

function Row({ label, children }) {
  return (
    <div className="py-1.5 border-b border-line last:border-0">
      <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-0.5">{label}</p>
      {children}
    </div>
  )
}

function ReadValue({ value, empty = '—' }) {
  const isEmpty = value === '' || value == null
  return (
    <span className={`font-sans text-[13px] ${isEmpty ? 'text-muted' : 'text-ink'}`}>
      {isEmpty ? empty : value}
    </span>
  )
}

export function CaseInfoPanel({
  caseData, onBack, status, setActiveTab, onShowNote, onSchedule, shippingPartnerName, onEdit,
}) {
  const [allAddons, setAllAddons] = useState([])

  useEffect(() => {
    fetchAddons().then(setAllAddons).catch(() => {})
  }, [])

  const addonLabels = (caseData.addons ?? [])
    .map(id => allAddons.find(a => a.id === id)?.name ?? id)

  return (
    <div className="w-[500px] flex-shrink-0 bg-white border-r border-line flex flex-col overflow-hidden">

      <div className="px-5 pt-5 pb-5 border-b border-line flex-shrink-0 relative">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-sans text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent outline-none mb-5"
        >
          <ArrowLeft size={12} />
          Cases
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-5 right-5 inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-line bg-white text-secondary hover:bg-canvas hover:text-ink text-[11.5px] font-medium font-sans transition-colors cursor-pointer outline-none"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
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
          <Row label="Date of Birth"><ReadValue value={caseData.dob} /></Row>
          <Row label="Date of Passing"><ReadValue value={caseData.dop} /></Row>
          <Row label="Location"><ReadValue value={caseData.location} /></Row>
        </InfoSection>

        <InfoSection title="Family Contact">
          <Row label="Name"><ReadValue value={caseData.contactName} /></Row>
          <Row label="Relationship"><ReadValue value={caseData.relationship} /></Row>
          <Row label="Phone"><ReadValue value={caseData.contactPhone} /></Row>
          <Row label="Email"><ReadValue value={caseData.contactEmail} /></Row>
        </InfoSection>

        <InfoSection title="Arrangements">
          <Row label="Package"><ReadValue value={caseData.package} /></Row>
          <Row label="Add-ons"><ReadValue value={addonLabels.join(', ')} empty="None" /></Row>
          <Row label="Crematorium"><ReadValue value={caseData.crematorium} /></Row>
          <Row label="Shipping Partner"><ReadValue value={shippingPartnerName} /></Row>
          <Row label="Folder"><ReadValue value={caseData.folderName} /></Row>
          <div className="flex items-baseline justify-between py-3 mt-1">
            <span className="font-sans text-[10px] text-muted uppercase tracking-wide">Total</span>
            <span className="font-display text-xl text-ink">${caseData.amount?.toLocaleString()}</span>
          </div>
        </InfoSection>
      </div>
    </div>
  )
}
