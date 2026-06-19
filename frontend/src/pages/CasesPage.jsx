import { useState, useMemo, useEffect } from 'react'
import { fetchFolders, createFolder, deleteFolder, fetchShippingPartners } from '../lib/api.js'
import { FolderDeleteModal } from '../components/ui/FolderDeleteModal.jsx'
import { CasesTopBar } from '../components/cases/CasesTopBar'
import { CasesListView } from '../components/cases/CasesListView'
import { CasesGridView } from '../components/cases/CasesGridView'
import { CasesColumnsView } from '../components/cases/CasesColumnsView'
import { CasePreviewPanel } from '../components/cases/CasePreviewPanel'
import { SelectionBar, StatusFooter, SMART_FOLDER_IDS } from '../components/cases/caseShared'

export function CasesPage({ cases, onViewCase, onNewCase, onCaseFolderAssign, onCasesChange }) {
  const [folder, setFolder] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [activeId, setActiveId] = useState(null)
  const [starredIds, setStarredIds] = useState(new Set())
  const [filters, setFilters] = useState({ packages: new Set(), statuses: new Set(), crematoriums: new Set(), datePreset: '', hasDocs: false, starredOnly: false })
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('cases-view-mode') || 'list' } catch { return 'list' }
  })
  const [sortBy, setSortBy] = useState('date')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [userFolders, setUserFolders] = useState([])
  const [shippingPartners, setShippingPartners] = useState([])
  const [dragOverFolderId, setDragOverFolderId] = useState(null)
  const [gridFolderView, setGridFolderView] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [localDeletedCaseIds, setLocalDeletedCaseIds] = useState(new Set())

  useEffect(() => {
    fetchFolders('cases').then(setUserFolders).catch(() => {})
    fetchShippingPartners().then(setShippingPartners).catch(() => {})
  }, [])

  const enrichedCases = useMemo(() => {
    if (shippingPartners.length === 0) return cases
    const byId = new Map(shippingPartners.map(p => [p.id, p.name]))
    return cases.map(c => c.shippingPartnerId
      ? { ...c, shippingPartnerName: byId.get(c.shippingPartnerId) ?? null }
      : c)
  }, [cases, shippingPartners])

  useEffect(() => {
    try { localStorage.setItem('cases-view-mode', viewMode) } catch { }
  }, [viewMode])

  useEffect(() => { setPage(1) }, [folder, search, filters, sortBy])

  const isStarred = (id) => starredIds.has(id)

  const filtersActive = filters.packages.size + filters.statuses.size + filters.crematoriums.size +
    (filters.datePreset ? 1 : 0) + (filters.hasDocs ? 1 : 0) + (filters.starredOnly ? 1 : 0)

  async function handleAddFolder(name) {
    try {
      const f = await createFolder({ name, type: 'cases' })
      setUserFolders(prev => [...prev, f])
    } catch (err) {
      console.error('Failed to create folder:', err.message)
    }
  }

  function handleDeleteFolder(folderId) {
    const f = userFolders.find(f => f.id === folderId)
    if (f) setPendingDelete(f)
  }

  async function confirmDeleteFolder(withContents) {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setPendingDelete(null)
    try {
      if (withContents) {
        const toDelete = new Set(cases.filter(c => c.folderId === id).map(c => c.id))
        setLocalDeletedCaseIds(prev => new Set([...prev, ...toDelete]))
      }
      await deleteFolder(id, { withContents, type: 'cases' })
      setUserFolders(prev => prev.filter(f => f.id !== id))
      if (folder === id) setFolder('all')
    } catch (err) {
      console.error('Failed to delete folder:', err.message)
    }
  }

  async function handleFolderDrop(e, folderId) {
    e.preventDefault()
    const caseId = e.dataTransfer.getData('caseId')
    if (!caseId || !onCaseFolderAssign) return
    setDragOverFolderId(null)
    await onCaseFolderAssign(caseId, folderId)
  }

  async function handleMoveToFolder(caseId, folderId) {
    if (!onCaseFolderAssign) return
    await onCaseFolderAssign(caseId, folderId)
  }

  async function handleCreateAndMove(caseId, name) {
    try {
      const f = await createFolder({ name, type: 'cases' })
      setUserFolders(prev => [...prev, f])
      if (onCaseFolderAssign) await onCaseFolderAssign(caseId, f.id)
    } catch (err) {
      console.error('Failed to create folder:', err.message)
    }
  }

  const isUserFolder = (id) => !SMART_FOLDER_IDS.has(id) && userFolders.some(f => f.id === id)

  const filtered = useMemo(() => {
    let rows = enrichedCases.filter(c => !localDeletedCaseIds.has(c.id))

    if (viewMode === 'columns') {
      if (isUserFolder(folder)) rows = rows.filter(c => c.folderId === folder)
      else if (folder === 'starred') rows = rows.filter(c => starredIds.has(c.id))
      else if (folder === 'recent') rows = rows.filter(c => c.status !== 'complete')
      else if (folder === 'unassigned') rows = rows.filter(c => !c.crematorium)
      else if (folder === 'needs-attention') rows = rows.filter(c => c.status === 'pending' && (c.documents || []).length === 0)
      else if (['pending', 'transit', 'cremation', 'complete'].includes(folder)) rows = rows.filter(c => c.status === folder)
    }

    if (filters.starredOnly)       rows = rows.filter(c => starredIds.has(c.id))
    if (filters.hasDocs)           rows = rows.filter(c => (c.documents || []).length > 0)
    if (filters.statuses.size)     rows = rows.filter(c => filters.statuses.has(c.status))
    if (filters.packages.size)     rows = rows.filter(c => filters.packages.has(c.package))
    if (filters.crematoriums.size) rows = rows.filter(c => filters.crematoriums.has(c.crematorium))
    if (filters.datePreset) {
      const cutoff = new Date()
      if (filters.datePreset === '7d')  cutoff.setDate(cutoff.getDate() - 7)
      if (filters.datePreset === '30d') cutoff.setDate(cutoff.getDate() - 30)
      if (filters.datePreset === '3m')  cutoff.setMonth(cutoff.getMonth() - 3)
      if (filters.datePreset === '1y')  cutoff.setFullYear(cutoff.getFullYear() - 1)
      rows = rows.filter(c => new Date(c.date || c.dateOpened) >= cutoff)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(c =>
        (c.deceased ?? '').toLowerCase().includes(q) ||
        (c.family ?? '').toLowerCase().includes(q) ||
        (c.id ?? '').toLowerCase().includes(q) ||
        (c.package ?? '').toLowerCase().includes(q) ||
        (c.crematorium ?? '').toLowerCase().includes(q)
      )
    }

    rows = [...rows]
    rows.sort((a, b) => {
      if (sortBy === 'name') {
        if (a.name == null && b.name == null) return 0
        if (a.name == null) return 1
        if (b.name == null) return -1
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'amount') {
        if (a.amount == null && b.amount == null) return 0
        if (a.amount == null) return 1
        if (b.amount == null) return -1
        return a.amount - b.amount
      }
      if (a.dateOpened == null && b.dateOpened == null) return 0
      if (a.dateOpened == null) return 1
      if (b.dateOpened == null) return -1
      return new Date(b.dateOpened) - new Date(a.dateOpened)
    })

    return rows
  }, [enrichedCases, folder, viewMode, search, filters, sortBy, starredIds, userFolders, localDeletedCaseIds])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const active = activeId ? cases.find(c => c.id === activeId) : null

  const folderCounts = useMemo(() => {
    const visible = cases.filter(c => !localDeletedCaseIds.has(c.id))
    const base = {
      all: visible.length,
      starred: visible.filter(c => starredIds.has(c.id)).length,
      recent: visible.filter(c => c.status !== 'complete').length,
      unassigned: visible.filter(c => !c.crematorium).length,
      'needs-attention': visible.filter(c => c.status === 'pending' && (c.documents || []).length === 0).length,
      pending: visible.filter(c => c.status === 'pending').length,
      transit: visible.filter(c => c.status === 'transit').length,
      cremation: visible.filter(c => c.status === 'cremation').length,
      complete: visible.filter(c => c.status === 'complete').length,
    }
    userFolders.forEach(f => { base[f.id] = visible.filter(c => c.folderId === f.id).length })
    return base
  }, [cases, starredIds, userFolders, localDeletedCaseIds])

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selectAll = () => setSelected(filtered.length === selected.size ? new Set() : new Set(filtered.map(c => c.id)))

  const crematoriumOptions = useMemo(() =>
    [...new Set(cases.map(c => c.crematorium).filter(Boolean))].sort()
  , [cases])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white text-ink">
      <CasesTopBar
        search={search} setSearch={setSearch}
        view={viewMode} setView={setViewMode}
        sortBy={sortBy} setSortBy={setSortBy}
        count={filtered.length} total={cases.length}
        filters={filters} setFilters={setFilters}
        filtersActive={filtersActive}
        crematoriumOptions={crematoriumOptions}
        onNewCase={onNewCase}
      />

      {selected.size > 0 && <SelectionBar count={selected.size} clear={() => setSelected(new Set())} />}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          {viewMode === 'list' && (
            <CasesListView
              rows={paginated} selected={selected}
              toggleSelect={toggleSelect} selectAll={selectAll}
              activeId={activeId} setActiveId={setActiveId}
              isStarred={isStarred}
              onViewCase={onViewCase}
              userFolders={userFolders}
              onMoveToFolder={handleMoveToFolder}
              onCreateAndMove={handleCreateAndMove}
            />
          )}
          {viewMode === 'grid' && (
            <CasesGridView
              cases={filtered}
              userFolders={userFolders}
              folderCounts={folderCounts}
              gridFolderView={gridFolderView}
              setGridFolderView={setGridFolderView}
              selected={selected}
              toggleSelect={toggleSelect}
              activeId={activeId} setActiveId={setActiveId}
              isStarred={isStarred}
              onViewCase={onViewCase}
              onAddFolder={handleAddFolder}
              onDeleteFolder={handleDeleteFolder}
              dragOverFolderId={dragOverFolderId}
              setDragOverFolderId={setDragOverFolderId}
              onFolderDrop={handleFolderDrop}
              onMoveToFolder={handleMoveToFolder}
              onCreateAndMove={handleCreateAndMove}
            />
          )}
          {viewMode === 'columns' && (
            <CasesColumnsView
              rows={paginated} activeId={activeId} setActiveId={setActiveId}
              folder={folder} setFolder={setFolder}
              counts={folderCounts} cases={cases}
              isStarred={isStarred}
              onViewCase={onViewCase}
              userFolders={userFolders}
              onAddFolder={handleAddFolder}
              onDeleteFolder={handleDeleteFolder}
              onFolderDrop={handleFolderDrop}
              dragOverFolderId={dragOverFolderId}
              setDragOverFolderId={setDragOverFolderId}
              onMoveToFolder={handleMoveToFolder}
              onCreateAndMove={handleCreateAndMove}
            />
          )}
        </div>

        {viewMode !== 'columns' && active && (
          <CasePreviewPanel c={active} close={() => setActiveId(null)} onViewCase={onViewCase} isStarred={isStarred} />
        )}
      </div>

      <StatusFooter
        count={filtered.length} selected={selected.size}
        pageSize={pageSize} setPageSize={v => { setPageSize(v); setPage(1) }}
        page={currentPage} totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        showPagination={viewMode !== 'columns'}
      />

      {pendingDelete && (
        <FolderDeleteModal
          folder={pendingDelete}
          itemLabel="cases"
          onDeleteWithContents={() => confirmDeleteFolder(true)}
          onDeleteFolder={() => confirmDeleteFolder(false)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
