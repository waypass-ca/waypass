import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCrematorium } from '../lib/api.js'
import { Button } from '../components/ui/Button'
import { PageTitle } from '../components/layout/PageTitle'

const STEPS = ['Details', 'Contact', 'Confirm']

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
                ${isDone ? 'bg-primary text-primary-contrast' : isActive ? 'bg-ink text-surface' : 'bg-line text-muted'}
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
              <div className={`w-10 h-0.5 mx-1 mb-4 ${i < currentStep ? 'bg-primary' : 'bg-line'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function InputField({ label, placeholder, type = 'text', prefix, value, onChange }) {
  return (
    <div>
      <label className="block font-sans text-xs font-medium text-ink mb-1.5">{label}</label>
      {prefix ? (
        <div className="flex items-center border border-line rounded-lg overflow-hidden bg-canvas focus-within:ring-1 focus-within:ring-ink/20">
          <span className="px-3 font-sans text-sm text-muted select-none border-r border-line bg-canvas py-2">{prefix}</span>
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            min={type === 'number' ? 0 : undefined}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-canvas px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink/20"
        />
      )}
    </div>
  )
}

function ConfirmRow({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-line last:border-0">
      <span className="font-sans text-xs text-muted">{label}</span>
      <span className="font-sans text-xs text-ink font-medium">{value || '—'}</span>
    </div>
  )
}

export function NewCrematoriumPage() {
  const navigate = useNavigate()
  const onBack = () => navigate('/crematoriums')
  const onComplete = () => navigate('/crematoriums')
  const [step, setStep] = useState(0)
  const [details, setDetails] = useState({ name: '', location: '', distance: '', website: '' })
  const [contact, setContact] = useState({ name: '', phone: '', avgTurnaround: '', avgFee: '' })
  const [isComplete, setIsComplete] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  async function handleConfirm() {
    setSubmitError(null)
    const payload = {
      name: details.name,
      location: details.location,
      distance: details.distance || null,
      website: details.website || null,
      contact: contact.name || null,
      phone: contact.phone || null,
      avg_turnaround: contact.avgTurnaround || null,
      avg_fee: contact.avgFee ? `$${contact.avgFee}` : null,
    }
    try {
      const newPartner = await createCrematorium(payload)
      setIsComplete(true)
      onComplete?.(newPartner)
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
        <h2 className="font-display text-3xl text-ink">Partner Added</h2>
        <p className="font-sans text-sm text-secondary mt-3 max-w-sm leading-relaxed">
          {details.name} has been added as a cremation partner and is now available for case assignments.
        </p>
        <div className="mt-6">
          <Button variant="primary" onClick={onBack}>View Partners</Button>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 px-8 py-7 bg-canvas overflow-auto">
    <div className="max-w-lg mx-auto py-8">
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 font-sans text-sm text-muted hover:text-ink transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <PageTitle>Add Cremation Partner</PageTitle>
        <p className="font-sans text-sm text-muted mt-1">Register a new crematorium as a service partner.</p>
      </div>

      <StepIndicator currentStep={step} />

      <div className="bg-surface rounded-xl border border-line p-6">

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-ink mb-4">Partner Details</h2>
            <InputField label="Crematorium Name" placeholder="e.g. Westlake Cremation Services" value={details.name} onChange={v => setDetails(p => ({ ...p, name: v }))} />
            <InputField label="Location" placeholder="e.g. San Francisco, CA" value={details.location} onChange={v => setDetails(p => ({ ...p, location: v }))} />
            <InputField label="Distance" placeholder="e.g. 12 miles" value={details.distance} onChange={v => setDetails(p => ({ ...p, distance: v }))} />
            <InputField label="Website" placeholder="e.g. https://westlakecremation.com" value={details.website} onChange={v => setDetails(p => ({ ...p, website: v }))} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-ink mb-4">Contact Information</h2>
            <InputField label="Contact Name" placeholder="e.g. John Smith" value={contact.name} onChange={v => setContact(p => ({ ...p, name: v }))} />
            <InputField label="Phone Number" type="tel" placeholder="e.g. (415) 555-0100" value={contact.phone} onChange={v => setContact(p => ({ ...p, phone: v }))} />
            <InputField label="Avg. Turnaround" placeholder="e.g. 3–5 days" value={contact.avgTurnaround} onChange={v => setContact(p => ({ ...p, avgTurnaround: v }))} />
            <InputField label="Avg. Fee" type="number" prefix="$" placeholder="295" value={contact.avgFee} onChange={v => setContact(p => ({ ...p, avgFee: v }))} />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-xl text-ink mb-4">Confirm Details</h2>
            <div className="mb-4">
              <p className="font-sans text-xs text-muted uppercase tracking-wide mb-2">Partner</p>
              <ConfirmRow label="Name" value={details.name} />
              <ConfirmRow label="Location" value={details.location} />
              <ConfirmRow label="Distance" value={details.distance} />
              <ConfirmRow label="Website" value={details.website} />
            </div>
            <div>
              <p className="font-sans text-xs text-muted uppercase tracking-wide mb-2">Contact</p>
              <ConfirmRow label="Contact" value={contact.name} />
              <ConfirmRow label="Phone" value={contact.phone} />
              <ConfirmRow label="Avg. Turnaround" value={contact.avgTurnaround} />
              <ConfirmRow label="Avg. Fee" value={contact.avgFee ? `$${contact.avgFee}` : ''} />
            </div>
            {submitError && (
              <p className="font-sans text-xs text-danger mt-4">{submitError}</p>
            )}
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-line">
          <Button variant="secondary" onClick={() => step === 0 ? onBack() : setStep(s => s - 1)}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < 2
            ? <Button variant="primary" onClick={() => setStep(s => s + 1)} disabled={step === 0 && !details.name.trim()}>
                Continue
              </Button>
            : <Button variant="primary" onClick={handleConfirm}>
                Add Partner
              </Button>
          }
        </div>
      </div>
    </div>
    </main>
  )
}
