import { useState } from 'react'
import { crematoriums } from '../../data/mockData.js'
import { Button } from '../ui/Button'

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-line last:border-0">
      <span className="font-sans text-xs text-muted">{label}</span>
      <span className="font-sans text-xs text-ink font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export function ScheduleTransportCard({ show }) {
  const [selectedCrematory, setSelectedCrematory] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [container, setContainer] = useState('')
  const [idDisc, setIdDisc] = useState('')
  const [orderSent, setOrderSent] = useState(false)
  const [sentTime, setSentTime] = useState(null)

  if (!show) return null

  function handleSend() {
    const t = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    setSentTime(t)
    setOrderSent(true)
  }

  const selectedName = crematoriums.find(c => c.id === selectedCrematory)?.name ?? ''
  const canSend = selectedCrematory && pickupDate && pickupTime

  return (
    <div className="bg-surface rounded-xl border border-line p-6">
      <p className="font-sans text-xs text-muted uppercase tracking-wide mb-1">Transport</p>
      <h2 className="font-display text-xl text-ink mb-5">Schedule Transport</h2>
      <div className="space-y-4">
        <div>
          <label className="font-sans text-xs text-muted block mb-1.5">Crematory</label>
          <select
            value={selectedCrematory}
            onChange={e => setSelectedCrematory(e.target.value)}
            className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white cursor-pointer"
          >
            <option value="">Select crematory…</option>
            {crematoriums.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.distance}</option>
            ))}
          </select>
          <p className="font-sans text-xs text-muted mt-1.5">Order will include all authorization documents attached to this case.</p>
        </div>
        <div>
          <label className="font-sans text-xs text-muted block mb-1.5">Preferred pickup window</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={pickupDate}
              onChange={e => setPickupDate(e.target.value)}
              className="flex-1 border border-line rounded-lg px-3 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
            />
            <select
              value={pickupTime}
              onChange={e => setPickupTime(e.target.value)}
              className="border border-line rounded-lg px-3 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white cursor-pointer"
            >
              <option value="">Time…</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        </div>
        <div>
          <label className="font-sans text-xs text-muted block mb-1.5">Combustible container</label>
          <input
            type="text"
            placeholder="e.g. Cardboard alternative container"
            value={container}
            onChange={e => setContainer(e.target.value)}
            className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
          />
        </div>
        <div>
          <label className="font-sans text-xs text-muted block mb-1.5">ID disc number</label>
          <input
            type="text"
            placeholder="e.g. 2024-0047"
            value={idDisc}
            onChange={e => setIdDisc(e.target.value)}
            className="w-full border border-line rounded-lg px-4 py-2.5 text-sm font-sans text-ink outline-none focus:border-ink transition-colors bg-white"
          />
        </div>
      </div>
      <Button variant="primary" onClick={handleSend} disabled={!canSend} className="w-full justify-center mt-5">
        Send Order to Crematory
      </Button>
    </div>
  )
}
