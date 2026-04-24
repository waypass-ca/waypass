import { useState, useEffect, useRef } from 'react'
import { fetchPackages, fetchCrematoriums, createCase } from '../../lib/api.js'
import { supabase } from '../../lib/supabase.js'
import { PackageCard } from '../widget/PackageCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const STEPS = ['First Call', 'Removal Log', 'Documents', 'Package', 'Crematorium', 'Confirm']

const STAFF_MEMBERS = [
  'James Whitfield',
  'Sandra Okafor',
  'Marcus Chen',
  'Priya Delacroix',
  'Tom Estrada',
]

const INITIAL_DOCS = {
  deathCertificate: { status: 'idle' },
  cremationPermit: { status: 'idle' },
  nokAuthorization: { status: 'idle' },
}

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
                ${isDone ? 'bg-primary text-white' : isActive ? 'bg-ink text-white' : 'bg-line text-muted'}
              `}>
                {isDone
                  ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : i + 1
                }
              </div>
              <span className={`text-[11px] font-sans mt-1 whitespace-nowrap ${isActive ? 'text-ink font-medium' : isDone ? 'text-primary' : 'text-muted'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 mb-4 ${i < currentStep ? 'bg-primary' : 'bg-line'}`} />
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
        className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
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
        className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

function DocumentSlot({ label, doc, onUpload }) {
  const inputRef = useRef(null)
  const isDone = doc.status === 'done'
  const isUploading = doc.status === 'uploading'
  const isError = doc.status === 'error'

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-primary-light' : 'bg-canvas'}`}>
          {isUploading ? (
            <svg className="w-4 h-4 text-muted animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className={`w-4 h-4 ${isDone ? 'text-primary' : isError ? 'text-danger' : 'text-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {isDone
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              }
            </svg>
          )}
        </div>
        <div>
          <p className="font-sans text-sm font-medium text-ink">{label}</p>
          <p className="font-sans text-xs text-muted mt-0.5 max-w-[200px] truncate">
            {isDone ? doc.name : isError ? 'Upload failed — try again' : 'Required'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={isDone ? 'primary' : isError ? 'red' : 'warning'}>
          {isDone ? 'Uploaded' : isError ? 'Error' : 'Pending'}
        </Badge>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = '' }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="text-xs font-sans text-secondary hover:text-ink transition-colors border border-line rounded-lg px-3 py-1.5 bg-white hover:border-ink cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading…' : isDone ? 'Replace' : 'Upload'}
        </button>
      </div>
    </div>
  )
}

function CrematoriumCard({ crm, selected, onSelect }) {
  return (
    <div
      onClick={crm.status === 'active' ? onSelect : undefined}
      className={`
        rounded-xl border-2 p-5 transition-all
        ${crm.status !== 'active' ? 'opacity-50 cursor-not-allowed border-line' :
          selected ? 'border-ink shadow-md cursor-pointer' : 'border-line cursor-pointer hover:border-secondary/40 hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-sans font-semibold text-sm text-ink">{crm.name}</p>
          <p className="font-sans text-xs text-muted mt-0.5">{crm.location} · {crm.distance}</p>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${selected ? 'border-ink bg-ink' : 'border-gray-300'}`}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-line">
        <div>
          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Turnaround</p>
          <p className="font-sans text-xs font-medium text-ink mt-0.5">{crm.avgTurnaround}</p>
        </div>
        <div>
          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Avg Fee</p>
          <p className="font-sans text-xs font-medium text-ink mt-0.5">{crm.avgFee}</p>
        </div>
        <div>
          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">YTD</p>
          <p className="font-sans text-xs font-medium text-ink mt-0.5">{crm.completedYTD} orders</p>
        </div>
      </div>
    </div>
  )
}

export function NewCasePage({ onBack, onComplete }) {
  const [step, setStep] = useState(0)
  const { packages, crematoriums } = useData()
  const sessionId = useRef(crypto.randomUUID()).current

  const [firstCall, setFirstCall] = useState({
    firstName: '', lastName: '',
    dateOfDeath: '', timeOfDeath: '',
    placeOfDeath: '',
    nokName: '', nokRelationship: '', nokPhone: '', nokEmail: '',
  })
  const [removalLog, setRemovalLog] = useState({
    staffMember: '', timeOfRemoval: '', wristbandId: '',
  })
  const [documents, setDocuments] = useState({ ...INITIAL_DOCS })
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedCrematorium, setSelectedCrematorium] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  function setFC(key, val) { setFirstCall(p => ({ ...p, [key]: val })) }
  function setRL(key, val) { setRemovalLog(p => ({ ...p, [key]: val })) }

  async function uploadDocument(type, file) {
    setDocuments(p => ({ ...p, [type]: { status: 'uploading' } }))
    const ext = file.name.split('.').pop()
    const path = `${sessionId}/${type}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('case-documents')
      .upload(path, file, { upsert: true })
    if (error) {
      setDocuments(p => ({ ...p, [type]: { status: 'error' } }))
      return
    }
    setDocuments(p => ({ ...p, [type]: { status: 'done', path, name: file.name } }))
  }

  async function handleConfirm() {
    setSubmitError(null)
    const payload = {
      deceased: `${firstCall.firstName} ${firstCall.lastName}`.trim() || 'New Decedent',
      family: firstCall.nokName ? `${firstCall.nokName.split(' ').slice(-1)[0]} Family` : 'New Family',
      contact_name: firstCall.nokName,
      contact_phone: firstCall.nokPhone,
      contact_email: firstCall.nokEmail,
      relationship: firstCall.nokRelationship,
      dop: firstCall.dateOfDeath || null,
      location: firstCall.placeOfDeath,
      is_deceased: true,
      package_id: selectedPackage?.id ?? null,
      package_name: selectedPackage?.name ?? 'Essential',
      package_price: selectedPackage?.price ?? 895,
      addon_names: [],
      status: 'pending',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: selectedPackage?.price ?? 895,
      crematorium_id: selectedCrematorium?.id ?? null,
      crematorium_name: selectedCrematorium?.name ?? null,
      time_of_death: firstCall.timeOfDeath || null,
      removal_staff: removalLog.staffMember || null,
      removal_time: removalLog.timeOfRemoval || null,
      wristband_id: removalLog.wristbandId || null,
      documents: Object.entries(documents)
        .filter(([, v]) => v.status === 'done')
        .map(([type, { path, name }]) => ({ type, path, name })),
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
        <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-2xl mb-5">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-3xl text-ink">Case Created</h2>
        <p className="font-sans text-sm text-secondary mt-3 max-w-sm leading-relaxed">
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
          className="flex items-center gap-1.5 text-xs font-sans text-muted hover:text-ink transition-colors cursor-pointer border-0 bg-transparent outline-none mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Cancel
        </button>
        <h1 className="font-display text-3xl font-light text-ink">New Case</h1>
        <p className="font-sans text-sm text-muted mt-1">Create a new arrangement for a family.</p>
      </div>

      <StepIndicator currentStep={step} />

      {/* Step 0 — First Call */}
      {step === 0 && (
        <div className="bg-surface rounded-xl border border-line p-7 max-w-2xl m-auto">
          <h2 className="font-sans text-sm font-semibold text-ink uppercase tracking-wide mb-5">First Call Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="First Name" placeholder="Deceased first name" value={firstCall.firstName} onChange={v => setFC('firstName', v)} />
            <InputField label="Last Name" placeholder="Deceased last name" value={firstCall.lastName} onChange={v => setFC('lastName', v)} />
            <InputField label="Date of Death" type="date" value={firstCall.dateOfDeath} onChange={v => setFC('dateOfDeath', v)} />
            <InputField label="Time of Death" type="time" value={firstCall.timeOfDeath} onChange={v => setFC('timeOfDeath', v)} />
            <div className="col-span-2">
              <SelectField
                label="Place of Death"
                options={['Hospital', 'Residence / Home', 'Nursing Facility', 'Hospice', 'Other']}
                value={firstCall.placeOfDeath}
                onChange={v => setFC('placeOfDeath', v)}
              />
            </div>
          </div>

          <div className="border-t border-line mt-6 pt-6">
            <h3 className="font-sans text-xs font-semibold text-muted uppercase tracking-wide mb-4">Next of Kin</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField label="Full Name" placeholder="Contact's full name" value={firstCall.nokName} onChange={v => setFC('nokName', v)} />
              </div>
              <SelectField
                label="Relationship to Deceased"
                options={['Spouse / Partner', 'Child', 'Parent', 'Sibling', 'Other Family', 'Legal Representative']}
                value={firstCall.nokRelationship}
                onChange={v => setFC('nokRelationship', v)}
              />
              <InputField label="Phone Number" placeholder="(415) 555-0100" type="tel" value={firstCall.nokPhone} onChange={v => setFC('nokPhone', v)} />
              <div className="col-span-2">
                <InputField label="Email Address" placeholder="email@example.com" type="email" value={firstCall.nokEmail} onChange={v => setFC('nokEmail', v)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button variant="primary" onClick={() => setStep(1)}>Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 1 — Removal Log */}
      {step === 1 && (
        <div className="bg-surface rounded-xl border border-line p-7 max-w-2xl m-auto">
          <h2 className="font-sans text-sm font-semibold text-ink uppercase tracking-wide mb-1">Removal Log</h2>

          <div className="flex items-start gap-2.5 bg-info-tint rounded-lg px-4 py-3 mb-6 mt-3">
            <svg className="w-4 h-4 text-info flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="font-sans text-xs text-info leading-relaxed">
              Saving this step automatically creates the first chain-of-custody entry for this case, timestamped to the time of removal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <SelectField
                label="Dispatching Staff Member"
                options={STAFF_MEMBERS}
                value={removalLog.staffMember}
                onChange={v => setRL('staffMember', v)}
              />
            </div>
            <InputField
              label="Time of Removal"
              type="datetime-local"
              value={removalLog.timeOfRemoval}
              onChange={v => setRL('timeOfRemoval', v)}
            />
            <InputField
              label="Temporary ID Wristband #"
              placeholder="e.g. WB-2024-0031"
              value={removalLog.wristbandId}
              onChange={v => setRL('wristbandId', v)}
            />
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(2)}>Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 2 — Documents */}
      {step === 2 && (
        <div className="bg-surface rounded-xl border border-line p-7 max-w-2xl m-auto">
          <h2 className="font-sans text-sm font-semibold text-ink uppercase tracking-wide mb-1">Required Documents</h2>
          <p className="font-sans text-xs text-muted mb-6 mt-1">Upload documents now or continue — you can upload later from the case file.</p>

          <div>
            <DocumentSlot
              label="Death Certificate"
              doc={documents.deathCertificate}
              onUpload={file => uploadDocument('deathCertificate', file)}
            />
            <DocumentSlot
              label="Cremation Permit"
              doc={documents.cremationPermit}
              onUpload={file => uploadDocument('cremationPermit', file)}
            />
            <DocumentSlot
              label="Next-of-Kin Authorization"
              doc={documents.nokAuthorization}
              onUpload={file => uploadDocument('nokAuthorization', file)}
            />
          </div>

          <p className="font-sans text-xs text-muted mt-5 leading-relaxed">
            Case will be flagged as <span className="text-warning font-medium">Authorization Pending</span> until all three documents are uploaded.
          </p>

          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>Continue →</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Package */}
      {step === 3 && (
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
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(4)} disabled={!selectedPackage}>
              {selectedPackage ? `Continue with ${selectedPackage.name} →` : 'Select a package'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Crematorium */}
      {step === 4 && (
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
            <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(5)} disabled={!selectedCrematorium}>
              {selectedCrematorium ? `Assign ${selectedCrematorium.name.split(' ')[0]} →` : 'Select a crematorium'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5 — Confirm */}
      {step === 5 && (
        <div className="max-w-2xl">
          <div className="bg-ink rounded-xl p-6 text-surface mb-4">
            <h3 className="font-display text-xl mb-5">Case Summary</h3>
            <div className="space-y-0">
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Deceased</span>
                <span className="font-sans text-sm font-medium">
                  {firstCall.firstName} {firstCall.lastName}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Date of Death</span>
                <span className="font-sans text-sm font-medium">{firstCall.dateOfDeath || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Next of Kin</span>
                <span className="font-sans text-sm font-medium">{firstCall.nokName || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Removal Staff</span>
                <span className="font-sans text-sm font-medium">{removalLog.staffMember || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="font-sans text-sm text-white/60">Documents</span>
                <span className="font-sans text-sm font-medium">
                  {Object.values(documents).filter(v => v.status === 'done').length} / 3 uploaded
                </span>
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
            <p className="font-sans text-xs text-danger mb-3">{submitError}</p>
          )}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(4)}>← Back</Button>
            <Button variant="primary" onClick={handleConfirm}>Create Case →</Button>
          </div>
        </div>
      )}
    </div>
  )
}
