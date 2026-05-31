import { Check, Download } from 'lucide-react'
import { FileIcon, DocMenu, DocsEmpty, openDoc } from './docsShared'

export function DocsListView({ rows, selected, toggleSelect, selectAll, onPreview, docFolders, onMoveToFolder, onCreateAndMove }) {
  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id))

  const Th = ({ children, className = '' }) => (
    <th className={`font-sans text-[10.5px] uppercase tracking-[0.08em] text-muted font-medium text-left px-3 py-2.5 ${className}`}>{children}</th>
  )

  return (
    <div className="bg-white">
      <table className="w-full" style={{ minWidth: 760 }}>
        <colgroup>
          <col style={{ width: 36 }} />
          <col style={{ minWidth: 220 }} />
          <col style={{ width: 160 }} />
          <col style={{ minWidth: 160 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 72 }} />
        </colgroup>
        <thead className="bg-white border-b border-line">
          <tr>
            <th className="px-3 py-2.5">
              <button onClick={selectAll} className="w-4 h-4 rounded border border-line bg-white flex items-center justify-center hover:border-secondary cursor-pointer">
                {allChecked && <Check size={11} className="text-ink" />}
              </button>
            </th>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Case</Th>
            <Th>Uploaded</Th>
            <Th>Size</Th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8}><DocsEmpty /></td>
            </tr>
          ) : rows.map(d => (
            <tr key={d.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('docId', d.id)
              }}
              onClick={() => onPreview(d)}
              className={`border-b border-line last:border-b-0 group transition-colors cursor-pointer
                ${selected.has(d.id) ? 'bg-info-tint/40' : 'hover:bg-canvas/40'}`}>
              <td className="px-3 py-2.5 align-middle">
                <button onClick={e => { e.stopPropagation(); toggleSelect(d.id) }}
                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition
                    ${selected.has(d.id) ? 'border-ink bg-ink' : 'border-line bg-white hover:border-secondary'}`}>
                  {selected.has(d.id) && <Check size={11} className="text-surface" />}
                </button>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileIcon ext={d.ext} size="sm" />
                  <span className="font-sans text-[13px] font-medium text-ink truncate">{d.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <span className="font-sans text-[12px] text-secondary">{d.type}</span>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <span className="font-sans text-[12px] text-secondary truncate block max-w-[200px]">{d.case}</span>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <span className="font-sans text-[11.5px] text-muted whitespace-nowrap">{d.uploadedAt}</span>
              </td>
              <td className="px-3 py-2.5 align-middle">
                <span className="font-sans text-[11.5px] text-muted">{d.size}</span>
              </td>
              <td className="px-2 py-2.5 align-middle">
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); openDoc(d.path) }} title="Download"
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-canvas text-muted cursor-pointer transition-colors">
                    <Download size={13} />
                  </button>
                  <DocMenu doc={d} onPreview={onPreview} folders={docFolders} onMoveToFolder={onMoveToFolder} onCreateAndMove={onCreateAndMove} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
