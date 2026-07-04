import { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { DocumentPreviewModal } from '../components/ui/DocumentPreviewModal'
import { FolderDeleteModal } from '../components/ui/FolderDeleteModal.jsx'
import { fetchFolders, createFolder, deleteFolder, assignDocFolder } from '../lib/api.js'
import { DocsTopBar } from '../components/documents/DocsTopBar'
import { DocsListView } from '../components/documents/DocsListView'
import { DocsGridView } from '../components/documents/DocsGridView'
import { DocsColumnsView } from '../components/documents/DocsColumnsView'
import {
  casesToDocs, filterByDate,
  activeDragDocId, setActiveDragDocId,
  DocsSelectionBar, DocsStatusFooter,
} from '../components/documents/docsShared'

export function DocumentsPage() {
  const { cases = [] } = useOutletContext()
  const [category]                    = useState('all')
  const [search, setSearch]           = useState('')
  const [view, setView]               = useState('list')
  const [sortBy, setSortBy]           = useState('date')
  const [selected, setSelected]       = useState(new Set())
  const [activeDocId, setActiveDocId] = useState(null)
  const [previewDoc, setPreviewDoc]   = useState(null)
  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(20)
  const [filters, setFilters]         = useState({ types: new Set(), statuses: new Set(), datePreset: '' })

  const [docFolders, setDocFolders]               = useState([])
  const [docFolderMap, setDocFolderMap]           = useState({})
  const [activeDocFolder, setActiveDocFolder]     = useState(null)
  const [docDragOverId, setDocDragOverId]         = useState(null)
  const [gridDocFolderView, setGridDocFolderView] = useState(null)
  const [pendingDocDelete, setPendingDocDelete]   = useState(null)
  const [localDeletedDocIds, setLocalDeletedDocIds] = useState(new Set())

  useEffect(() => {
    fetchFolders('documents').then(setDocFolders).catch(() => {})
  }, [])

  async function handleAddDocFolder(name) {
    try {
      const f = await createFolder({ name, type: 'documents' })
      setDocFolders(prev => [...prev, f])
    } catch (err) {
      console.error('Failed to create folder:', err.message)
    }
  }

  function handleDeleteDocFolder(folderId) {
    const f = docFolders.find(f => f.id === folderId)
    if (f) setPendingDocDelete(f)
  }

  async function confirmDeleteDocFolder(withContents) {
    if (!pendingDocDelete) return
    const { id } = pendingDocDelete
    setPendingDocDelete(null)
    try {
      const docsInFolder = allDocsWithFolders.filter(d => d._folderId === id)

      if (withContents) {
        setLocalDeletedDocIds(prev => new Set([...prev, ...docsInFolder.map(d => d.id)]))
        setDocFolderMap(prev => {
          const n = { ...prev }
          Object.keys(n).forEach(k => { if (n[k] === id) delete n[k] })
          return n
        })
      } else {
        setDocFolderMap(prev => {
          const n = { ...prev }
          docsInFolder.forEach(d => { n[d.id] = null })
          return n
        })
      }

      await deleteFolder(id, { withContents, type: 'documents' })
      setDocFolders(prev => prev.filter(f => f.id !== id))
      if (activeDocFolder === id) setActiveDocFolder(null)
      if (gridDocFolderView === id) setGridDocFolderView(null)
    } catch (err) {
      console.error('Failed to delete folder:', err.message)
    }
  }

  const allDocs = useMemo(() => casesToDocs(cases), [cases])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- manual memo kept intentionally
  const allDocsWithFolders = useMemo(() =>
    allDocs
      .filter(d => !localDeletedDocIds.has(d.id))
      .map(d => ({
        ...d,
        _folderId: d.id in docFolderMap ? docFolderMap[d.id] : d.dbFolderId,
      }))
  , [allDocs, docFolderMap, localDeletedDocIds])

  async function handleDocMoveToFolder(docId, folderId) {
    if (folderId === null) {
      setDocFolderMap(prev => { const n = { ...prev }; delete n[docId]; return n })
    } else {
      setDocFolderMap(prev => ({ ...prev, [docId]: folderId }))
    }
    const doc = allDocs.find(d => d.id === docId)
    if (!doc?.structuredId) return
    try {
      await assignDocFolder(doc.caseId, doc.structuredId, folderId)
    } catch (err) {
      console.error('Failed to persist folder assignment:', err.message)
    }
  }

  async function handleDocFolderDrop(e, folderId) {
    e.preventDefault()
    const docId = e.dataTransfer.getData('docId')
    if (!docId || docId !== activeDragDocId) return
    setActiveDragDocId(null)
    setDocDragOverId(null)
    await handleDocMoveToFolder(docId, folderId)
  }

  async function handleDocCreateAndMove(docId, name) {
    try {
      const f = await createFolder({ name, type: 'documents' })
      setDocFolders(prev => [...prev, f])
      await handleDocMoveToFolder(docId, f.id)
    } catch (err) {
      console.error('Failed to create folder:', err.message)
    }
  }

  const filtersActive = filters.types.size + filters.statuses.size + (filters.datePreset ? 1 : 0)

  const categoryFiltered = useMemo(() => {
    if (category === 'all') return allDocsWithFolders
    return allDocsWithFolders.filter(d => d.status === category)
  }, [allDocsWithFolders, category])

  const searched = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return categoryFiltered
    return categoryFiltered.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.case.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    )
  }, [categoryFiltered, search])

  const filterApplied = useMemo(() => {
    let docs = searched
    if (filters.statuses.size) docs = docs.filter(d => filters.statuses.has(d.status))
    if (filters.types.size)    docs = docs.filter(d => filters.types.has(d.type))
    docs = filterByDate(docs, filters.datePreset)
    return docs
  }, [searched, filters, activeDocFolder])

  const sorted = useMemo(() => {
    return [...filterApplied].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'case') return a.case.localeCompare(b.case)
      if (sortBy === 'type') return a.type.localeCompare(b.type)
      return new Date(b.uploadedAt) - new Date(a.uploadedAt)
    })
  }, [filterApplied, sortBy])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize)

  const docFolderCounts = useMemo(() => {
    const map = {}
    docFolders.forEach(f => {
      map[f.id] = allDocsWithFolders.filter(d => d._folderId === f.id).length
    })
    return map
  }, [docFolders, allDocsWithFolders])

  const toggleSelect = id => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const selectAll = () => {
    setSelected(s => s.size === paginated.length ? new Set() : new Set(paginated.map(d => d.id)))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to first page when filters change
  useEffect(() => { setPage(1) }, [category, search, filters, sortBy])

  const handlePreview = async (doc) => {
    if (!doc.path) {
      setPreviewDoc({ ...doc, url: null })
      return
    }
    const { data, error } = await supabase.storage.from('case-documents').createSignedUrl(doc.path, 3600)
    setPreviewDoc({ ...doc, url: error ? null : (data?.signedUrl ?? null) })
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      <DocsTopBar
        search={search} setSearch={setSearch}
        view={view} setView={setView}
        sortBy={sortBy} setSortBy={setSortBy}
        count={sorted.length} total={allDocsWithFolders.length}
        filters={filters} setFilters={setFilters}
        filtersActive={filtersActive}
      />

      {view !== 'columns' && selected.size > 0 && <DocsSelectionBar count={selected.size} clear={() => setSelected(new Set())} />}

      {view === 'columns' ? (
        <div className="flex-1 overflow-hidden">
          <DocsColumnsView
            docs={sorted}
            activeDocId={activeDocId}
            setActiveDocId={setActiveDocId}
            onPreview={handlePreview}
            docFolders={docFolders}
            activeDocFolder={activeDocFolder}
            setActiveDocFolder={setActiveDocFolder}
            onAddDocFolder={handleAddDocFolder}
            onDeleteDocFolder={handleDeleteDocFolder}
            onDocFolderDrop={handleDocFolderDrop}
            docDragOverId={docDragOverId}
            setDocDragOverId={setDocDragOverId}
            docFolderCounts={docFolderCounts}
            onMoveToFolder={handleDocMoveToFolder}
            onCreateAndMove={handleDocCreateAndMove}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {view === 'list'
            ? <DocsListView
                rows={paginated} selected={selected}
                toggleSelect={toggleSelect} selectAll={selectAll}
                onPreview={handlePreview}
                docFolders={docFolders}
                onMoveToFolder={handleDocMoveToFolder}
                onCreateAndMove={handleDocCreateAndMove}
              />
            : <DocsGridView
                docs={sorted}
                docFolders={docFolders}
                docFolderCounts={docFolderCounts}
                gridDocFolderView={gridDocFolderView}
                setGridDocFolderView={setGridDocFolderView}
                selected={selected}
                toggleSelect={toggleSelect}
                onPreview={handlePreview}
                onAddDocFolder={handleAddDocFolder}
                onDeleteDocFolder={handleDeleteDocFolder}
                docDragOverId={docDragOverId}
                setDocDragOverId={setDocDragOverId}
                onDocFolderDrop={handleDocFolderDrop}
                onMoveToFolder={handleDocMoveToFolder}
                onCreateAndMove={handleDocCreateAndMove}
              />
          }
        </div>
      )}

      <DocsStatusFooter
        count={sorted.length}
        selected={selected.size}
        pageSize={pageSize} setPageSize={p => { setPageSize(p); setPage(1) }}
        page={page} totalPages={totalPages}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
      />

      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
      {pendingDocDelete && (
        <FolderDeleteModal
          folder={pendingDocDelete}
          itemLabel="documents"
          onDeleteWithContents={() => confirmDeleteDocFolder(true)}
          onDeleteFolder={() => confirmDeleteDocFolder(false)}
          onCancel={() => setPendingDocDelete(null)}
        />
      )}
    </div>
  )
}
