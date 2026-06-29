// Tiny pub/sub for transient app-level toasts (errors, success confirmations).
// Separate from the inbox NotificationToast which mirrors realtime inbox_items.
const listeners = new Set()
let nextId = 1

export function showToast({ message, kind = 'info', ttlMs = 4000 }) {
  const id = nextId++
  const toast = { id, message, kind, createdAt: Date.now() }
  listeners.forEach(l => l({ kind: 'add', toast }))
  if (ttlMs > 0) {
    setTimeout(() => {
      listeners.forEach(l => l({ kind: 'remove', id }))
    }, ttlMs)
  }
  return id
}

export const toastError = (message) => showToast({ message, kind: 'error', ttlMs: 6000 })
export const toastSuccess = (message) => showToast({ message, kind: 'success' })
export const toastInfo = (message) => showToast({ message, kind: 'info' })

export function subscribeToasts(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function dismissToast(id) {
  listeners.forEach(l => l({ kind: 'remove', id }))
}
