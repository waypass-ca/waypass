import { useState, useEffect } from 'react'
import { fetchPackages, fetchCrematoriums, createCase } from '../../lib/api.js'
import { PackageCard } from '../widget/PackageCard'
import { Button } from '../ui/Button'

const STEPS = ['Deceased', 'Contact', 'Package', 'Crematorium', 'Confirm']

function useData() {
  const [packages, setPackages] = useState([])
  const [crematoriums, setCrematoriums] = useState([])
  useEffect(() => {
    fetchPackages().then(setPackages).catch(console.error)
    fetchCrematoriums().then(setCrematoriums).catch(console.error)
  }, [])
  return { packages, crematoriums }
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((label, i) => {
        const isDone = i < currentStep
        const isActive = i === currentStep
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-sans font-medium transition-all
                ${isDone ? 'bg-sage text-white' : isActive ? 'bg-charcoal text-white' : 'bg-border text-muted'}
              `}>
                {isDone
                  ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : i + 1
                }
              </div>
              <span className={`text-[11px] font-sans mt-1 whitespace-nowrap ${isActive ? 'text-charcoal font-medium' : isDone ? 'text-sage' : 'text-muted'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 mb-4 ${i < currentStep ? 'bg-sage' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function InputField({ label, placeholder, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-sans text-muted mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
      />
    </div>
  )
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-sans text-muted mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

function CrematoriumCard({ crm, selected, onSelect }) {
  return (
    <div
      onClick={crm.status === 'active' ? onSelect : undefined}
      className={`
        rounded-xl border-2 p-5 transition-all
        ${crm.status !== 'active' ? 'opacity-50 cursor-not-allowed border-border' :
          selected ? 'border-charcoal shadow-md cursor-pointer' : 'border-border cursor-pointer hover:border-slate/40 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-sans font-semibold text-sm text-charcoal">{crm.name}</p>
          <p className="font-sans text-xs text-muted mt-0.5">{crm.location} · {crm.distance}</p>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${selected ? 'border-charcoal bg-charcoal' : 'border-gray-300'}`}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
        <div>
          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Turnaround</p>
          <p className="font-sans text-xs font-medium text-charcoal mt-0.5">{crm.avgTurnaround}</p>
        </div>
        <div>
          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Avg Fee</p>
          <p className="font-sans text-xs font-medium text-charcoal mt-0.5">{crm.avgFee}</p>
        </div>
        <div>
          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">YTD</p>
          <p className="font-sans text-xs font-medium text-charcoal mt-0.5">{crm.completedYTD} orders</p>
        </div>
      </div>
    </div>
  )
}

export function NewCasePage({ onBack, onComplete }) {
  const [step, setStep] = useState(0)
  const { packages, crematoriums } = useData()

  // Form state
  const [deceased, setDeceased] = useState({ firstName: '', lastName: '', dob: '', dop: '', location: '', isDeceased: true })
  const [contact, setContact] = useState({ name: '', relationship: '', phone: '', email: '' })
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedCrematorium, setSelectedCrematorium] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  async function handleConfirm() {
    setSubmitError(null)
    const payload = {
      deceased: `${deceased.firstName} ${deceased.lastName}`.trim() || 'New Decedent',
      family: contact.name ? `${contact.name.split(' ').slice(-1)[0]} Family` : 'New Family',
      contact_name: contact.name,
      contact_phone: contact.phone,
      contact_email: contact.email,
      relationship: contact.relationship,
      dob: deceased.dob,
      dop: deceased.isDeceased ? deceased.dop : null,
      location: deceased.location,
      is_deceased: deceased.isDeceased,
      package_id: selectedPackage?.id ?? null,
      package_name: selectedPackage?.name ?? 'Essential',
      package_price: selectedPackage?.price ?? 895,
      addon_names: [],
      status: 'pending',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: selectedPackage?.price ?? 895,
      crematorium_id: selectedCrematorium?.id ?? null,
      crematorium_name: selectedCrematorium?.name ?? null,
      documents: [],
    }
    try {
      const newCase = await createCase(payload)
      setIsComplete(true)
      onComplete?.(newCase)
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center text-center py-16">
        <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center text-2xl mb-5">
          <svg className="w-7 h-7 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-3xl text-charcoal">Case Created</h2>
        <p className="font-sans text-sm text-slate mt-3 max-w-sm leading-relaxed">
          The new case has been created and is now visible in your Cases list.
          The family will receive a confirmation email shortly.
        </p>
        <div className="mt-6">
          <Button variant="primary" onClick={onBack}>View All Cases</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-sans text-muted hover:text-charcoal transition-colors cursor-pointer border-0 bg-transparent outline-none mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Cancel
        </button>
        <h1 className="font-display text-3xl font-light text-charcoal">New Case</h1>
        <p className="font-sans text-sm text-muted mt-1">Create a new arrangement for a family.</p>
      </div>

      <StepIndicator currentStep={step} />

      {/* Step 0 — Deceased Info */}
      {step === 0 && (
        <div className="bg-warm-white rounded-xl border border-border p-7 max-w-2xl">
          <h2 className="font-sans text-sm font-semibold text-charcoal uppercase tracking-wide mb-5">About the Deceased</h2>

          {/* Deceased toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 mb-6 transition-colors ${deceased.isDeceased ? 'border-sage bg-sage-light/40' : 'border-border bg-cream'}`}>
            <div>
              <p className="font-sans text-sm font-medium text-charcoal">Confirmed Deceased</p>
              <p className="font-sans text-xs text-muted mt-0.5">
                {deceased.isDeceased ? 'Person has passed — date of passing required' : 'Pre-arrangement — person is still living'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeceased(p => ({ ...p, isDeceased: !p.isDeceased }))}
              className={`w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ml-6 relative border-0 outline-none ${deceased.isDeceased ? 'bg-sage' : 'bg-border'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${deceased.isDeceased ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="First Name" placeholder="First name" value={deceased.firstName} onChange={v => setDeceased(p => ({ ...p, firstName: v }))} />
            <InputField label="Last Name" placeholder="Last name" value={deceased.lastName} onChange={v => setDeceased(p => ({ ...p, lastName: v }))} />
            <InputField label="Date of Birth" type="date" value={deceased.dob} onChange={v => setDeceased(p => ({ ...p, dob: v }))} />
            {deceased.isDeceased && (
              <InputField label="Date of Passing" type="date" value={deceased.dop} onChange={v => setDeceased(p => ({ ...p, dop: v }))} />
            )}
            <div className={deceased.isDeceased ? 'col-span-2' : 'col-span-1'}>
              <SelectField
                label="Current Location"
                options={['Hospital', 'Residence / Home', 'Nursing Facility', 'Hospice', 'Other']}
                value={deceased.location}
                onChange={v => setDeceased(p => ({ ...p, location: v }))}
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="primary" onClick={() => setStep(1)}>Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 1 — Contact Info */}
      {step === 1 && (
        <div className="bg-warm-white rounded-xl border border-border p-7 max-w-2xl">
          <h2 className="font-sans text-sm font-semibold text-charcoal uppercase tracking-wide mb-5">Family Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <InputField label="Full Name" placeholder="Contact's full name" value={contact.name} onChange={v => setContact(p => ({ ...p, name: v }))} />
            </div>
            <SelectField
              label="Relationship to Deceased"
              options={['Spouse / Partner', 'Child', 'Parent', 'Sibling', 'Other Family', 'Legal Representative']}
              value={contact.relationship}
              onChange={v => setContact(p => ({ ...p, relationship: v }))}
            />
            <InputField label="Phone Number" placeholder="(415) 555-0100" type="tel" value={contact.phone} onChange={v => setContact(p => ({ ...p, phone: v }))} />
            <div className="col-span-2">
              <InputField label="Email Address" placeholder="email@example.com" type="email" value={contact.email} onChange={v => setContact(p => ({ ...p, email: v }))} />
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(2)}>Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 2 — Package */}
      {step === 2 && (
        <div>
          <div className="grid grid-cols-3 gap-4 max-w-3xl mb-6">
            {packages.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPackage?.id === pkg.id}
                onSelect={() => setSelectedPackage(pkg)}
              />
            ))}
          </div>
          <div className="flex justify-between max-w-3xl">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(3)} disabled={!selectedPackage}>
              {selectedPackage ? `Continue with ${selectedPackage.name} →` : 'Select a package'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Crematorium */}
      {step === 3 && (
        <div>
          <div className="grid grid-cols-3 gap-4 max-w-3xl mb-6">
            {crematoriums.map(crm => (
              <CrematoriumCard
                key={crm.id}
                crm={crm}
                selected={selectedCrematorium?.id === crm.id}
                onSelect={() => setSelectedCrematorium(crm)}
              />
            ))}
          </div>
          <div className="flex justify-between max-w-3xl">
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(4)} disabled={!selectedCrematorium}>
              {selectedCrematorium ? `Assign ${selectedCrematorium.name.split(' ')[0]} →` : 'Select a crematorium'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Confirm */}
      {step === 4 && (
        <div className="max-w-2xl">
          <div className="bg-charcoal rounded-xl p-6 text-warm-white mb-4">
            <h3 className="font-display text-xl mb-5">Case Summary</h3>
            <div className="space-y-0">
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Deceased</span>
                <span className="font-sans text-sm font-medium">
                  {deceased.firstName} {deceased.lastName}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Family Contact</span>
                <span className="font-sans text-sm font-medium">{contact.name || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Package</span>
                <span className="font-sans text-sm font-medium">{selectedPackage?.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Crematorium</span>
                <span className="font-sans text-sm font-medium">{selectedCrematorium?.name}</span>
              </div>
              <div className="flex justify-between pt-4 mt-1">
                <span className="font-sans text-sm text-white/60">Arrangement Total</span>
                <span className="font-display text-3xl">${selectedPackage?.price.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {submitError && (
            <p className="font-sans text-xs text-red-soft mb-3">{submitError}</p>
          )}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
            <Button variant="sage" onClick={handleConfirm}>Create Case →</Button>
          </div>
        </div>
      )}
    </div>
  )
}
