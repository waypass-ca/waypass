import { DocRow } from './DocRow'

export function CaseDocumentsTab({
  documents, uploading, docsActionNeeded, authorizationComplete,
  onShowAuth, onUpload, onPreview, onRenameDoc, onDeleteDoc, onUpdateDocMeta,
}) {
  return (
    <div className="px-6 pt-5 pb-4 bg-white min-h-full">
      {documents.length > 0 ? (
        <div>
          {documents.map(doc => (
            <DocRow
              key={doc.id ?? doc.storagePath ?? doc.fileName}
              doc={doc}
              onPreview={onPreview}
              onRename={onRenameDoc}
              onDelete={onDeleteDoc}
              onUpdateMeta={onUpdateDocMeta}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-sans text-sm text-muted">No documents uploaded yet.</p>
          <p className="font-sans text-xs text-muted mt-1">Use the Upload button above to add files.</p>
        </div>
      )}
    </div>
  )
}
