import { useState, useEffect } from 'react'
import { fetchPackages, fetchAddons } from '../lib/api.js'
import { PackageCard } from '../components/widget/PackageCard'
import { AddonRow } from '../components/widget/AddonRow'
import { OrderSummary } from '../components/widget/OrderSummary'
import { SuccessScreen } from '../components/widget/SuccessScreen'
import { Button } from '../components/ui/Button'

const STEPS = ['Package', 'Details', 'Add-ons', 'Review']

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const isDone = i < currentStep
        const isActive = i === currentStep
        return (
          <div key={i} className="flex items-center">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-medium transition-all
                  ${isDone ? 'bg-sage text-white' : isActive ? 'bg-charcoal text-white' : 'bg-border text-muted'}
                `}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-sans mt-1.5 whitespace-nowrap ${
                  isActive ? 'text-charcoal font-medium' : isDone ? 'text-sage' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-1 mb-5 transition-all ${i < currentStep ? 'bg-sage' : 'bg-border'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ——— Step 1: Package Selection ———
function StepPackage({ packages, selected, onSelect, onNext }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-charcoal">Choose Your Package</h2>
        <p className="font-sans text-sm text-muted mt-1">
          All packages include licensed professional care and dignified transport.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {packages.map(pkg => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            selected={selected?.id === pkg.id}
            onSelect={() => onSelect(pkg)}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!selected}
        >
          {selected ? `Continue with ${selected.name} →` : 'Select a package to continue'}
        </Button>
      </div>
    </div>
  )
}

// ——— Step 2: Deceased Details Form ———
function StepDetails({ onBack, onNext }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-charcoal">Your Information</h2>
        <p className="font-sans text-sm text-muted mt-1">
          Please provide the details below so we can begin the arrangement process.
        </p>
      </div>

      {/* About Your Loved One */}
      <div className="bg-warm-white rounded-xl p-6 border border-border mb-4">
        <h3 className="font-sans text-sm font-semibold text-charcoal mb-4 uppercase tracking-wide">
          About Your Loved One
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">First Name</label>
            <input
              type="text"
              placeholder="First name"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Last Name</label>
            <input
              type="text"
              placeholder="Last name"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Date of Birth</label>
            <input
              type="date"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Date of Passing</label>
            <input
              type="date"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-sans text-muted mb-1.5">Current Location</label>
            <select className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white">
              <option value="">Select location type</option>
              <option>Hospital</option>
              <option>Residence / Home</option>
              <option>Nursing Facility</option>
              <option>Hospice</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-warm-white rounded-xl p-6 border border-border mb-8">
        <h3 className="font-sans text-sm font-semibold text-charcoal mb-4 uppercase tracking-wide">
          Your Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-sans text-muted mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Relationship</label>
            <select className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white">
              <option value="">Select relationship</option>
              <option>Spouse / Partner</option>
              <option>Child</option>
              <option>Parent</option>
              <option>Sibling</option>
              <option>Other Family</option>
              <option>Friend</option>
              <option>Legal Representative</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-sans text-muted mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="(415) 555-0100"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-sans text-muted mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm font-sans text-charcoal outline-none focus:border-charcoal transition-colors bg-white"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button variant="primary" onClick={onNext}>Continue →</Button>
      </div>
    </div>
  )
}

// ——— Step 3: Add-ons ———
function StepAddons({ addons, selectedAddons, onToggle, selectedPackage, onBack, onNext }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-charcoal">Customize Your Arrangement</h2>
        <p className="font-sans text-sm text-muted mt-1">
          Optional additions to personalise the service for your family.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Addons list */}
        <div className="col-span-3 space-y-3">
          {addons.map(addon => (
            <AddonRow
              key={addon.id}
              addon={addon}
              selected={selectedAddons.some(a => a.id === addon.id)}
              onToggle={() => onToggle(addon)}
            />
          ))}
        </div>

        {/* Live order summary */}
        <div className="col-span-2">
          <OrderSummary selectedPackage={selectedPackage} selectedAddons={selectedAddons} />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button variant="primary" onClick={onNext}>Continue →</Button>
      </div>
    </div>
  )
}

// ——— Step 4: Review ———
function StepReview({ selectedPackage, selectedAddons, onBack, onConfirm }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-charcoal">Review & Confirm</h2>
        <p className="font-sans text-sm text-muted mt-1">
          Please review your arrangement before confirming.
        </p>
      </div>

      <div className="mb-4">
        <OrderSummary selectedPackage={selectedPackage} selectedAddons={selectedAddons} />
      </div>

      {/* Payment timing banner */}
      <div className="bg-amber-light border border-amber/20 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-amber text-base mt-0.5">ℹ</span>
        <div>
          <p className="font-sans text-sm font-medium text-amber">Regarding Payment</p>
          <p className="font-sans text-xs text-amber/80 mt-0.5 leading-relaxed">
            Payment is not collected at this time. A member of our care team will contact you within 2 hours
            to complete arrangements and provide a secure payment link.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button variant="sage" onClick={onConfirm}>Confirm Arrangements →</Button>
      </div>
    </div>
  )
}

// ——— Main Page ———
export function FamilyWidgetPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  const [packages, setPackages] = useState([])
  const [addons, setAddons] = useState([])

  useEffect(() => {
    fetchPackages().then(setPackages).catch(console.error)
    fetchAddons().then(setAddons).catch(console.error)
  }, [])

  function toggleAddon(addon) {
    setSelectedAddons(prev =>
      prev.some(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    )
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <SuccessScreen caseId="PSG-2024-0896" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Branding label */}
      <div className="text-center mb-3">
        <span className="font-sans text-xs text-muted">
          Evergreen Memorial · Powered by{' '}
          <span className="font-medium text-charcoal">Passage</span>
        </span>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-display text-[38px] font-light text-charcoal leading-tight">
          Cremation Services
        </h1>
        <p className="font-sans text-sm text-slate mt-2 max-w-md mx-auto leading-relaxed">
          Transparent pricing, compassionate care. We guide your family through every step
          with dignity and clarity.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step content */}
      {currentStep === 0 && (
        <StepPackage
          packages={packages}
          selected={selectedPackage}
          onSelect={setSelectedPackage}
          onNext={() => setCurrentStep(1)}
        />
      )}
      {currentStep === 1 && (
        <StepDetails
          onBack={() => setCurrentStep(0)}
          onNext={() => setCurrentStep(2)}
        />
      )}
      {currentStep === 2 && (
        <StepAddons
          addons={addons}
          selectedAddons={selectedAddons}
          onToggle={toggleAddon}
          selectedPackage={selectedPackage}
          onBack={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      )}
      {currentStep === 3 && (
        <StepReview
          selectedPackage={selectedPackage}
          selectedAddons={selectedAddons}
          onBack={() => setCurrentStep(2)}
          onConfirm={() => setIsComplete(true)}
        />
      )}
    </div>
  )
}
