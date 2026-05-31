import { Badge } from '../../ui/Badge'

function PartnerRow({ crm, onClick }) {
  const isActive = crm.status === 'active'
  return (
    <tr
      onClick={onClick}
      className="border-b border-line cursor-pointer group transition-colors hover:bg-canvas/40"
    >
      <td className="px-3 py-3 align-middle">
        <span className="font-sans text-[13.5px] font-medium text-ink truncate">{crm.name}</span>
      </td>
      <td className="px-3 py-2.5 align-middle">
        {crm.location && (
          <span className="font-sans text-[12px] text-muted truncate">{crm.location}</span>
        )}
      </td>
      <td className="px-3 py-2.5 align-middle">
        <Badge variant={isActive ? 'primary' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Badge>
      </td>
    </tr>
  )
}

export function PartnersList({ crematoriums, search, onSelect }) {
  const filtered = crematoriums.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.location ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (crematoriums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
        <div className="w-12 h-12 rounded-full bg-canvas border border-line flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="font-sans text-sm font-medium text-ink">No partners yet</p>
        <p className="font-sans text-xs text-muted mt-1">Use Find a Partner to discover and add crematoriums.</p>
      </div>
    )
  }

  const Th = ({ children }) => (
    <th className="font-sans text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium text-left px-3 py-2.5">{children}</th>
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 400 }}>
              <thead className="bg-white border-b border-line">
                <tr>
                  <Th>Name</Th>
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center">
                      <p className="font-display text-[17px] text-secondary">No results</p>
                      <p className="font-sans text-[12px] text-muted mt-1">Try a different search.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(crm => (
                    <PartnerRow key={crm.id} crm={crm} onClick={() => onSelect(crm)} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 px-6 py-2.5 border-t border-line">
        <p className="font-sans text-[11px] text-muted">
          {filtered.length} of {crematoriums.length} partner{crematoriums.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
