import { Button } from '../ui/Button'
import { SectionTitle, Divider } from './settingsShared'

export function BillingSection() {
  return (
    <div>
      <SectionTitle title="Current Plan" />
      <div className="bg-ink rounded-xl p-6 text-surface">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-sans text-xs text-white/40 uppercase tracking-widest mb-1">Plan</p>
            <p className="font-display text-3xl text-white">Professional</p>
            <p className="font-sans text-sm text-white/50 mt-1">Up to 50 cases/month · 3 crematorium partners</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-white">$199<span className="font-sans text-base text-white/40">/mo</span></p>
            <p className="font-sans text-xs text-white/40 mt-1">Renews Apr 1, 2025</p>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-white/10 flex gap-3">
          <Button variant="secondary" className="border-white/20 text-white hover:bg-white/10">Upgrade Plan</Button>
          <Button variant="secondary" className="border-white/20 text-white/50 hover:bg-white/10">Cancel Plan</Button>
        </div>
      </div>

      <Divider />

      <SectionTitle title="Payment Method" />
      <div className="flex items-center justify-between py-3.5 border border-line rounded-xl px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-6 bg-info rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-bold tracking-tight">VISA</span>
          </div>
          <div>
            <p className="font-sans text-sm text-ink">•••• •••• •••• 4242</p>
            <p className="font-sans text-xs text-muted">Expires 09/2026</p>
          </div>
        </div>
        <Button variant="secondary">Update</Button>
      </div>

      <Divider />

      <SectionTitle title="Billing History" />
      <div className="rounded-xl border border-line overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-canvas border-b border-line">
              {['Date', 'Description', 'Amount', 'Receipt'].map(col => (
                <th key={col} className="text-left px-5 py-3 text-xs font-sans font-medium text-muted uppercase tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { date: 'Mar 1, 2025', desc: 'Professional Plan — March 2025', amount: '$199.00' },
              { date: 'Feb 1, 2025', desc: 'Professional Plan — February 2025', amount: '$199.00' },
              { date: 'Jan 1, 2025', desc: 'Professional Plan — January 2025', amount: '$199.00' },
            ].map((row, i) => (
              <tr key={i} className={`hover:bg-canvas/50 transition-colors ${i > 0 ? 'border-t border-line' : ''}`}>
                <td className="px-5 py-3 font-sans text-xs text-muted whitespace-nowrap">{row.date}</td>
                <td className="px-5 py-3 font-sans text-sm text-ink">{row.desc}</td>
                <td className="px-5 py-3 font-sans text-sm font-medium text-ink">{row.amount}</td>
                <td className="px-5 py-3">
                  <button className="font-sans text-xs font-medium text-primary hover:text-primary/70 transition-colors cursor-pointer border-0 bg-transparent outline-none">
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
