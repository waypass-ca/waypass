import { useState, useEffect, useRef } from 'react'
import { fetchPackages, fetchCrematoriums, createCase, fetchEmailTemplate, fetchPortalSettings, saveEmailOverride } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { TEMPLATES, EmailPreview as EmailPreviewComponent, PreviewModal, TemplateEditor, EditableEmailPreview, DEFAULT_SECTIONS, DEFAULT_PROGRESS_LABELS, SAMPLE } from '../components/dashboard/EmailEditorPage'
import { Star, Check, Eye, X, Pencil, ChevronDown, MapPin } from 'lucide-react'
import { generateEmailHtml, buildSubject, buildEmailConfig } from '../lib/emailHtml.jsx'
import { sendFamilyEmail } from '../lib/api.js'
import { toastError, toastSuccess } from '../lib/toast.js'

const STEPS = ['First Call', 'Removal Log', 'Documents', 'Package', 'Crematorium', 'Email Template', 'Confirm']

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
                ${isDone ? 'bg-primary text-surface' : isActive ? 'bg-ink text-surface' : 'bg-line text-muted'}
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
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [globalTemplateId, setGlobalTemplateId] = useState('classic')
  const [favouriteTemplateIds, setFavouriteTemplateIds] = useState([])
  const [logoUrl, setLogoUrl] = useState('')
  const [selectedCrematorium, setSelectedCrematorium] = useState(null)
  const [caseCustomizations, setCaseCustomizations] = useState({})
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [showEmailConfirm, setShowEmailConfirm] = useState(false)
  const [expandedPackageId, setExpandedPackageId] = useState(null)
  const [expandedCrematoriumId, setExpandedCrematoriumId] = useState(null)
  const [mapCrematorium, setMapCrematorium] = useState(null)

  useEffect(() => {
    fetchEmailTemplate().then(d => {
      if (d?.activeTemplateId) setGlobalTemplateId(d.activeTemplateId)
      if (d?.favouriteIds) setFavouriteTemplateIds(d.favouriteIds)
    }).catch(() => {})
    fetchPortalSettings().then(d => { if (d?.logoUrl) setLogoUrl(d.logoUrl) }).catch(() => {})
  }, [])

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

  const chosenTemplateId = selectedTemplateId || globalTemplateId
  const chosenTemplate = TEMPLATES.find(t => t.id === chosenTemplateId) || TEMPLATES[0]

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
      if (selectedTemplateId || Object.keys(caseCustomizations).length > 0) {
        saveEmailOverride(newCase.id, { activeTemplateId: selectedTemplateId || globalTemplateId, customizations: caseCustomizations }).catch(() => {})
      }

      // Send initial confirmation email to family
      if (firstCall.nokEmail?.trim()) {
        try {
          const cust = caseCustomizations[chosenTemplateId]
          const config = buildEmailConfig(cust, chosenTemplate)
          const sections = cust?.sections || DEFAULT_SECTIONS
          const html = generateEmailHtml(chosenTemplate, sections, config, newCaseData, logoUrl)
          const subject = buildSubject('pending', config.footerName)
          await sendFamilyEmail({ to: firstCall.nokEmail.trim(), subject, html })
          toastSuccess(`Confirmation email sent to ${firstCall.nokEmail.trim()}`)
        } catch {
          toastError('Case created, but the confirmation email could not be sent.')
        }
      }

      setIsComplete(true)
      onComplete?.(newCase)
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  const newCaseData = {
    deceased: `${firstCall.firstName} ${firstCall.lastName}`.trim() || undefined,
    family: firstCall.nokName ? `The ${firstCall.nokName.split(' ').slice(-1)[0]} Family` : undefined,
    status: 'pending',
    package: selectedPackage?.name ? `${selectedPackage.name} Package` : undefined,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    documents: Object.entries(documents).filter(([, v]) => v.status === 'done').map(([, v]) => v.name || 'Document'),
  }

  if (step === 5 && editingTemplateId) {
    const template = TEMPLATES.find(t => t.id === editingTemplateId)
    return (
      <TemplateEditor
        template={template}
        customization={caseCustomizations[editingTemplateId]}
        onSave={data => {
          setCaseCustomizations(prev => ({ ...prev, [editingTemplateId]: data }))
          setSelectedTemplateId(editingTemplateId)
        }}
        onBack={() => setEditingTemplateId(null)}
        logoUrl={logoUrl}
        caseData={newCaseData}
      />
    )
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
      {/* Template preview modal — top level so it always reads fresh caseCustomizations */}
      {previewTemplate && step === 5 && (
        <PreviewModal
          t={previewTemplate}
          isActive={false}
          isFavourite={favouriteTemplateIds.includes(previewTemplate.id)}
          onSetActive={id => { setSelectedTemplateId(id); setPreviewTemplate(null) }}
          onToggleFavourite={() => {}}
          onClose={() => setPreviewTemplate(null)}
          onEdit={t => { setPreviewTemplate(null); setEditingTemplateId(t.id) }}
          logoUrl={logoUrl}
          caseMode={true}
          customization={caseCustomizations[previewTemplate.id] || null}
          caseData={newCaseData}
        />
      )}

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

      {step === 0 && (
        <div className="max-w-2xl mx-auto">
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

          <div className="flex justify-end mt-8 pt-6 border-t border-line">
            <Button variant="primary" onClick={() => setStep(1)}>Continue →</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="max-w-2xl mx-auto">
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

          <div className="flex justify-between mt-8 pt-6 border-t border-line">
            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(2)}>Continue →</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl mx-auto">
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

          <div className="flex justify-between mt-8 pt-6 border-t border-line">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>Continue →</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-sm font-semibold text-ink uppercase tracking-wide mb-1">Select a Package</h2>
          <p className="font-sans text-xs text-muted mb-6 mt-1">Choose the service package for this arrangement.</p>
          <div>
            {packages.map(pkg => {
              const isSelected = selectedPackage?.id === pkg.id
              const isExpanded = expandedPackageId === pkg.id
              return (
                <div key={pkg.id} className="border-b border-line last:border-0">
                  <div
                    onClick={() => setSelectedPackage(pkg)}
                    className="flex items-center justify-between py-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-ink bg-ink' : 'border-line group-hover:border-secondary'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-sans text-sm font-semibold text-ink">{pkg.name}</p>
                        <p className="font-sans text-xs text-muted mt-0.5">{pkg.features?.slice(0, 2).join(' · ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <span className="font-display text-2xl text-ink">${pkg.price?.toLocaleString()}</span>
                        <p className="font-sans text-[10px] text-muted">per service</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedPackageId(isExpanded ? null : pkg.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink transition-colors border-0 outline-none cursor-pointer bg-transparent"
                      >
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="pl-8 pb-4">
                      <p className="font-sans text-[10px] text-muted uppercase tracking-wide mb-3">Included Services</p>
                      <ul className="space-y-2">
                        {pkg.features?.map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5 font-sans text-sm text-secondary">
                            <Check size={12} className="text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-8 pt-6 border-t border-line">
            <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(4)} disabled={!selectedPackage}>
              {selectedPackage ? `Continue with ${selectedPackage.name} →` : 'Select a package'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 5: Email Template ── */}
      {step === 5 && !editingTemplateId && (() => {
        const favourites = TEMPLATES.filter(t => favouriteTemplateIds.includes(t.id))
        const renderCard = (t) => {
          const isSelected = selectedTemplateId ? t.id === selectedTemplateId : t.id === globalTemplateId
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTemplateId(t.id)}
              className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-primary shadow-lg shadow-primary/10'
                  : 'border border-line hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-white font-sans text-[10px] font-semibold shadow-sm">
                  <Check size={9} strokeWidth={3} /> Selected
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                <button
                  onClick={e => { e.stopPropagation(); setPreviewTemplate(t) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-ink font-sans text-xs font-medium shadow-md cursor-pointer border-0 outline-none hover:bg-white/90 transition-colors"
                >
                  <Eye size={12} /> Preview
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setEditingTemplateId(t.id) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-ink font-sans text-xs font-medium shadow-md cursor-pointer border-0 outline-none hover:bg-white/90 transition-colors"
                >
                  <Pencil size={12} /> Edit
                </button>
                {!isSelected && (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedTemplateId(t.id) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-sans text-xs font-medium shadow-md cursor-pointer border-0 outline-none hover:bg-primary/90 transition-colors"
                  >
                    <Check size={12} /> Select
                  </button>
                )}
              </div>
              <div className="p-3">
                <div className="rounded-lg overflow-hidden w-full" style={{ backgroundColor: t.bg }}>
                  <div style={{ backgroundColor: t.headerBg, padding: '6px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                      <div style={{ height: 1.5, width: '40%', backgroundColor: (t.headerText || '#fff') + 'AA', borderRadius: 99 }} />
                    </div>
                  </div>
                  <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ height: 2, width: '55%', backgroundColor: t.text + '40', borderRadius: 99 }} />
                    <div style={{ height: 1.5, width: '40%', backgroundColor: (t.muted || '#888') + '50', borderRadius: 99 }} />
                    <div style={{ backgroundColor: t.cardBg || '#fff', borderRadius: 3, padding: '3px 5px' }}>
                      <div style={{ height: 1, backgroundColor: t.text + '20', borderRadius: 99, marginBottom: 1.5 }} />
                      <div style={{ height: 1, width: '75%', backgroundColor: t.text + '15', borderRadius: 99 }} />
                    </div>
                  </div>
                  <div style={{ backgroundColor: t.footerBg, padding: '4px 8px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ height: 1, width: '35%', backgroundColor: (t.footerText || '#888') + '50', borderRadius: 99 }} />
                  </div>
                </div>
              </div>
              <div className="border-t border-line/50 bg-white px-3 pb-3 pt-2">
                <div className="font-sans font-semibold text-[13px] text-ink">{t.name}</div>
                <div className="font-sans text-[11px] text-muted">{t.tagline}</div>
              </div>
            </div>
          )
        }

        return (
          <div className="flex flex-col max-w-4xl mx-auto w-full" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <p className="font-sans text-sm text-muted mb-4 max-w-4xl shrink-0">
              Choose the email template the family will receive for this case. Default is <span className="text-ink font-medium">{TEMPLATES.find(t => t.id === globalTemplateId)?.name || 'Classic'}</span>.
            </p>

            <div className="flex-1 overflow-auto min-h-0 max-w-4xl pb-4 px-1 -mx-1">
              {/* Favourites */}
              {favourites.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={12} className="text-amber-500 flex-shrink-0" style={{ fill: 'currentColor' }} />
                    <p className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted">Favourites</p>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                    {favourites.map(renderCard)}
                  </div>
                </div>
              )}

              {/* All Templates */}
              <div>
                <p className="font-sans text-[10.5px] uppercase tracking-[0.1em] text-muted mb-3">All Templates</p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                  {TEMPLATES.map(renderCard)}
                </div>
              </div>
            </div>

            <div className="flex justify-between max-w-4xl pt-4 shrink-0 border-t border-line mt-2">
              <Button variant="secondary" onClick={() => setStep(4)}>← Back</Button>
              <Button variant="primary" onClick={() => setStep(6)}>
                Continue with {chosenTemplate.name} →
              </Button>
            </div>
          </div>
        )
      })()}


      {/* ── Step 4: Crematorium ── */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-sm font-semibold text-ink uppercase tracking-wide mb-1">Select Crematorium</h2>
          <p className="font-sans text-xs text-muted mb-6 mt-1">Choose the crematorium partner for this case.</p>
          <div>
            {crematoriums.map(crm => {
              const isActive = crm.status === 'active'
              const isSelected = selectedCrematorium?.id === crm.id
              const isExpanded = expandedCrematoriumId === crm.id
              return (
                <div key={crm.id} className={`border-b border-line last:border-0 ${!isActive ? 'opacity-40' : ''}`}>
                  <div
                    onClick={isActive ? () => setSelectedCrematorium(crm) : undefined}
                    className={`flex items-center justify-between py-4 group ${isActive ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-ink bg-ink' : 'border-line group-hover:border-secondary'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-sans text-sm font-semibold text-ink">{crm.name}</p>
                        <p className="font-sans text-xs text-muted mt-0.5">{crm.location} · {crm.distance}</p>
                      </div>
                    </div>
                    {isActive && (
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedCrematoriumId(isExpanded ? null : crm.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink transition-colors border-0 outline-none cursor-pointer bg-transparent flex-shrink-0 ml-4"
                      >
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="pl-8 pb-4 flex items-center justify-between">
                      <div className="grid grid-cols-3 gap-8">
                        <div>
                          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Turnaround</p>
                          <p className="font-sans text-xs font-medium text-ink mt-1">{crm.avgTurnaround}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Avg Fee</p>
                          <p className="font-sans text-xs font-medium text-ink mt-1">{crm.avgFee}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] text-muted uppercase tracking-wide">YTD Orders</p>
                          <p className="font-sans text-xs font-medium text-ink mt-1">{crm.completedYTD}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setMapCrematorium(crm)}
                        className="flex items-center gap-1.5 text-xs font-sans text-muted hover:text-ink transition-colors cursor-pointer border-0 outline-none bg-transparent flex-shrink-0 ml-6"
                      >
                        <MapPin size={12} />
                        View on map
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-8 pt-6 border-t border-line">
            <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
            <Button variant="primary" onClick={() => setStep(5)} disabled={!selectedCrematorium}>
              {selectedCrematorium ? `Continue with ${selectedCrematorium.name.split(' ')[0]} →` : 'Select a crematorium'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 6: Confirm ── */}
      {step === 6 && (
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-sm font-semibold text-ink uppercase tracking-wide mb-5">Case Summary</h2>
          <div>
            <div className="flex justify-between py-3.5 border-b border-line">
              <span className="font-sans text-sm text-muted">Deceased</span>
              <span className="font-sans text-sm font-medium text-ink">
                {firstCall.firstName} {firstCall.lastName}
              </span>
            </div>
            <div className="flex justify-between py-3.5 border-b border-line">
              <span className="font-sans text-sm text-muted">Date of Death</span>
              <span className="font-sans text-sm font-medium text-ink">{firstCall.dateOfDeath || '—'}</span>
            </div>
            <div className="flex justify-between py-3.5 border-b border-line">
              <span className="font-sans text-sm text-muted">Next of Kin</span>
              <span className="font-sans text-sm font-medium text-ink">{firstCall.nokName || '—'}</span>
            </div>
            <div className="flex justify-between py-3.5 border-b border-line">
              <span className="font-sans text-sm text-muted">Removal Staff</span>
              <span className="font-sans text-sm font-medium text-ink">{removalLog.staffMember || '—'}</span>
            </div>
            <div className="flex justify-between py-3.5 border-b border-line">
              <span className="font-sans text-sm text-muted">Documents</span>
              <span className="font-sans text-sm font-medium text-ink">
                {Object.values(documents).filter(v => v.status === 'done').length} / 3 uploaded
              </span>
            </div>
            <div className="flex justify-between py-3.5 border-b border-line">
              <span className="font-sans text-sm text-muted">Package</span>
              <span className="font-sans text-sm font-medium text-ink">{selectedPackage?.name}</span>
            </div>
            <div className="flex justify-between py-3.5 border-b border-line">
              <span className="font-sans text-sm text-muted">Email Template</span>
              <span className="font-sans text-sm font-medium text-ink">{chosenTemplate.name}</span>
            </div>
            <div className="flex justify-between py-3.5 border-b border-line">
              <span className="font-sans text-sm text-muted">Crematorium</span>
              <span className="font-sans text-sm font-medium text-ink">{selectedCrematorium?.name}</span>
            </div>
            <div className="flex justify-between items-baseline pt-5 mt-2 border-t border-line">
              <span className="font-sans text-sm text-muted">Arrangement Total</span>
              <span className="font-display text-3xl text-ink">${selectedPackage?.price.toLocaleString()}</span>
            </div>
          </div>

          {submitError && (
            <p className="font-sans text-xs text-danger mt-4">{submitError}</p>
          )}
          <div className="flex justify-between mt-8 pt-6 border-t border-line">
            <Button variant="secondary" onClick={() => setStep(5)}>← Back</Button>
            <Button variant="primary" onClick={() => setShowEmailConfirm(true)}>Create Case →</Button>
          </div>
        </div>
      )}

      {/* ── Crematorium map modal ── */}
      {mapCrematorium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMapCrematorium(null)} />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-canvas rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface">
              <div>
                <p className="font-sans font-semibold text-[15px] text-ink">{mapCrematorium.name}</p>
                <p className="font-sans text-xs text-muted mt-0.5">{mapCrematorium.location} · {mapCrematorium.distance}</p>
              </div>
              <button
                onClick={() => setMapCrematorium(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-line/50 transition-colors cursor-pointer border-0 outline-none bg-transparent"
              >
                <X size={15} />
              </button>
            </div>
            <div className="h-80">
              <iframe
                title={mapCrematorium.name}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapCrematorium.location)}&output=embed`}
              />
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-line bg-surface">
              <div className="flex items-center gap-5">
                <div>
                  <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Turnaround</p>
                  <p className="font-sans text-xs font-medium text-ink mt-0.5">{mapCrematorium.avgTurnaround}</p>
                </div>
                <div>
                  <p className="font-sans text-[10px] text-muted uppercase tracking-wide">Avg Fee</p>
                  <p className="font-sans text-xs font-medium text-ink mt-0.5">{mapCrematorium.avgFee}</p>
                </div>
                <div>
                  <p className="font-sans text-[10px] text-muted uppercase tracking-wide">YTD Orders</p>
                  <p className="font-sans text-xs font-medium text-ink mt-0.5">{mapCrematorium.completedYTD}</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(mapCrematorium.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-secondary hover:text-ink hover:border-ink/30 font-sans text-xs font-medium transition-colors outline-none"
              >
                <MapPin size={12} />
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Email confirmation modal ── */}
      {showEmailConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEmailConfirm(false)} />
          <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[92vh] flex flex-col bg-canvas rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0 bg-surface">
              <div>
                <p className="font-sans font-semibold text-[15px] text-ink">Confirm Initial Email</p>
                <p className="font-sans text-xs text-muted mt-0.5">
                  Sending to <span className="font-medium text-ink">{firstCall.nokEmail || 'no email provided'}</span>
                  {' '}using the <span className="font-medium text-ink">{chosenTemplate.name}</span> template
                </p>
                {!firstCall.nokEmail && (
                  <p className="font-sans text-[11px] text-warning mt-0.5">No email address — case will be created but no email will be sent.</p>
                )}
              </div>
              <button
                onClick={() => setShowEmailConfirm(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-line/50 transition-colors cursor-pointer border-0 outline-none bg-transparent"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-canvas">
              <div className="p-6">
                <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5">
                  <EditableEmailPreview
                    template={chosenTemplate}
                    sections={caseCustomizations[chosenTemplateId]?.sections || DEFAULT_SECTIONS}
                    config={{
                      fontSize: caseCustomizations[chosenTemplateId]?.fontSize || 13,
                      headingSize: caseCustomizations[chosenTemplateId]?.headingSize || 22,
                      headingColor: caseCustomizations[chosenTemplateId]?.headingColor || chosenTemplate.text,
                      message: caseCustomizations[chosenTemplateId]?.message || SAMPLE.message,
                      greeting: caseCustomizations[chosenTemplateId]?.greeting || '',
                      progressLabels: caseCustomizations[chosenTemplateId]?.progressLabels || [...DEFAULT_PROGRESS_LABELS],
                      buttonLabel: caseCustomizations[chosenTemplateId]?.buttonLabel || 'Contact',
                      buttonRadius: 8,
                      cardRadius: 10,
                      footerName: caseCustomizations[chosenTemplateId]?.footerName || SAMPLE.funeralHome,
                      footerTagline: caseCustomizations[chosenTemplateId]?.footerTagline || SAMPLE.tagline,
                      footerAddress: caseCustomizations[chosenTemplateId]?.footerAddress || '123 Memorial Lane · San Francisco · (415) 555-0100',
                      footerCopyright: caseCustomizations[chosenTemplateId]?.footerCopyright || `© 2024 ${SAMPLE.funeralHome} · Unsubscribe`,
                    }}
                    logoUrl={logoUrl}
                    caseData={newCaseData}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-surface flex-shrink-0">
              <button
                onClick={() => setShowEmailConfirm(false)}
                className="px-4 py-2 rounded-lg border border-line bg-white font-sans text-[13px] text-secondary hover:text-ink hover:border-ink/30 transition-colors cursor-pointer outline-none"
              >
                ← Go Back
              </button>
              <button
                onClick={() => { setShowEmailConfirm(false); handleConfirm() }}
                className="px-5 py-2 rounded-lg bg-primary text-white font-sans text-[13px] font-medium cursor-pointer border-0 outline-none hover:bg-primary/90 transition-colors"
              >
                Confirm & Create Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
