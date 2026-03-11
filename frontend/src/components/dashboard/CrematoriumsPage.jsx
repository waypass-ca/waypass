import { useState, useEffect } from 'react'
import { fetchCrematoriums, fetchOrders } from '../../lib/api.js'
import { PageHeader } from '../layout/PageHeader'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'

function CrematoriumCard({ crm }) {
  return (
    <div className="bg-warm-white rounded-xl border border-border overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start justify-between border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-sans font-semibold text-sm text-charcoal">{crm.name}</h3>
            <Badge variant={crm.status === 'active' ? 'sage' : 'red'}>{crm.status === 'active' ? 'Active' : 'Inactive'}</Badge>
          </div>
          <p className="font-sans text-xs text-muted">{crm.location} · {crm.distance} away</p>
        </div>
        <Button variant="small">Contact</Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        {[
          { label: 'Active Orders', value: crm.active },
          { label: 'Completed YTD', value: crm.completedYTD },
          { label: 'Avg Turnaround', value: crm.avgTurnaround },
          { label: 'Avg Fee', value: crm.avgFee },
        ].map(stat => (
          <div key={stat.label} className="px-4 py-3 text-center">
            <p className="font-display text-xl text-charcoal">{stat.value}</p>
            <p className="font-sans text-[10px] text-muted mt-0.5 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Contact + partner since */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-sans text-xs text-muted">{crm.phone}</span>
          <span className="font-sans text-xs text-muted">{crm.contact}</span>
        </div>
        <span className="font-sans text-xs text-muted">Partner since {crm.since}</span>
      </div>
    </div>
  )
}

export function CrematoriumsPage() {
  const [crematoriums, setCrematoriums] = useState([])
  const [crematoriumOrders, setCrematoriumOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchCrematoriums(), fetchOrders()])
      .then(([crms, orders]) => {
        setCrematoriums(crms)
        setCrematoriumOrders(orders)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="font-sans text-sm text-muted">Loading…</p>
    </div>
  )

  const activeCount = crematoriums.filter(c => c.status === 'active').length
  const totalCompleted = crematoriums.reduce((s, c) => s + c.completedYTD, 0)
  const activeOrders = crematoriums.reduce((s, c) => s + c.active, 0)

  return (
    <div>
      <PageHeader
        title="Crematoriums"
        subtitle="Manage your cremation service partners"
        date="March 10, 2024"
        rightSlot={<Button variant="primary">+ Add Partner</Button>}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Partner Crematoriums', value: crematoriums.length },
          { label: 'Active Partners', value: activeCount },
          { label: 'Active Orders', value: activeOrders },
          { label: 'Total Completed YTD', value: totalCompleted },
        ].map(s => (
          <div key={s.label} className="bg-warm-white rounded-xl border border-border p-5">
            <p className="font-sans text-xs text-muted uppercase tracking-wide">{s.label}</p>
            <p className="font-display text-3xl text-charcoal mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Crematorium cards */}
      <div className="space-y-4 mb-8">
        {crematoriums.map(crm => (
          <CrematoriumCard key={crm.id} crm={crm} />
        ))}
      </div>

      {/* Active orders from crematoriums */}
      <div className="bg-warm-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl text-charcoal">Active Orders</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-cream border-b border-border">
              {['Case ID', 'Deceased', 'Crematorium', 'Package', 'Scheduled', 'Status'].map(col => (
                <th key={col} className="text-left px-6 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crematoriumOrders.map(o => {
              const stepLabels = ['Received', 'Intake', 'Cremation', 'Return']
              return (
                <tr key={o.id} className="border-t border-border hover:bg-cream/50 transition-colors">
                  <td className="px-6 py-3"><span className="font-mono text-xs text-muted">{o.id}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-sm text-charcoal">{o.name}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-xs text-slate">{o.funeral_home}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-sm text-slate">{o.package}</span></td>
                  <td className="px-6 py-3"><span className="font-sans text-xs text-muted">{o.scheduled}</span></td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-charcoal">
                      <span className="w-1.5 h-1.5 rounded-full bg-charcoal" />
                      {stepLabels[o.status]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
