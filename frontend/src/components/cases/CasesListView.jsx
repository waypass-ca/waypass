import { Folder, Check, Eye } from 'lucide-react'
import { StarFilled, StatusBadge, PackageChip, CaseMenu } from './caseShared'

export function CasesListView({ rows, selected, toggleSelect, selectAll, activeId, setActiveId, isStarred, onViewCase, userFolders, onMoveToFolder, onCreateAndMove }) {
  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id))

  const Th = ({ children, className = '' }) => (
    <th className={`font-sans text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium text-left px-3 py-2.5 ${className}`}>{children}</th>
  )

  return (
    <div>
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 760 }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ minWidth: 200 }} />
              <col style={{ width: 110 }} />
              <col style={{ minWidth: 160 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 40 }} />
            </colgroup>
            <thead className="bg-white border-b border-line">
              <tr>
                <th className="px-3 py-2.5">
                  <button onClick={selectAll} className="w-4 h-4 rounded border border-line bg-white flex items-center justify-center hover:border-secondary cursor-pointer">
                    {allChecked && <Check size={11} className="text-ink" />}
                  </button>
                </th>
                <Th>Name</Th>
                <Th>Package</Th>
                <Th>Crematorium</Th>
                <Th>Status</Th>
                <Th>Opened</Th>
                <Th className="text-right pr-4">Amount</Th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Folder size={32} className="mx-auto text-muted/40 mb-3" />
                    <p className="font-display text-[17px] text-secondary">No cases here</p>
                    <p className="font-sans text-[12px] text-muted mt-1">Try a different folder or adjust your search.</p>
                  </td>
                </tr>
              ) : rows.map(c => (
                <tr key={c.id}
                  onClick={() => onViewCase(c.id)}
                  className={`border-b border-line last:border-b-0 cursor-default group transition-colors
                    ${activeId === c.id ? 'bg-canvas/80' : 'hover:bg-canvas/40'}
                    ${selected.has(c.id) ? 'bg-info-tint/40' : ''}`}>
                  <td className="px-3 py-2.5 align-middle">
                    <button onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
                        ${selected.has(c.id) ? 'border-ink bg-ink' : 'border-line bg-white hover:border-secondary'}`}>
                      {selected.has(c.id) && <Check size={11} className="text-surface" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-[13.5px] font-medium text-ink truncate">{c.deceased}</span>
                        {isStarred(c.id) && <StarFilled size={11} className="text-warning shrink-0" />}
                      </div>
                      <div className="font-sans text-[11.5px] text-muted truncate">{c.family}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle"><PackageChip pkg={c.package} /></td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="font-sans text-[12px] text-secondary truncate block max-w-[200px]">
                      {c.crematorium || <span className="italic text-muted">— Unassigned</span>}
                    </span>
                    {c.shippingPartnerName && (
                      <span className="font-sans text-[10.5px] text-muted truncate block max-w-[200px]">
                        via {c.shippingPartnerName}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="font-sans text-[11.5px] text-muted whitespace-nowrap">{c.date}</span>
                  </td>
                  <td className="px-3 py-2.5 align-middle text-right pr-4">
                    <span className="font-sans text-[12.5px] font-medium text-ink tabular-nums whitespace-nowrap">${c.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-2 py-2.5 align-middle">
                    <button
                      onClick={e => { e.stopPropagation(); setActiveId(c.id === activeId ? null : c.id) }}
                      title="Preview"
                      className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100
                        ${activeId === c.id ? 'bg-ink text-surface opacity-100' : 'hover:bg-canvas text-muted'}`}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
