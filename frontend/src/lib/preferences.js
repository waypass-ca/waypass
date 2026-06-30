// Per-user local preferences (no backend round-trip needed).
// Scoped by user id so multiple accounts on the same browser stay separate.

const KEY = userId => `waypass:prefs:${userId}`

function read(userId) {
  if (!userId) return {}
  try {
    return JSON.parse(localStorage.getItem(KEY(userId))) ?? {}
  } catch {
    return {}
  }
}

function write(userId, prefs) {
  if (!userId) return
  localStorage.setItem(KEY(userId), JSON.stringify(prefs))
}

export function getDefaultShippingPartnerId(userId) {
  return read(userId).defaultShippingPartnerId ?? null
}

export function setDefaultShippingPartnerId(userId, partnerId) {
  const prefs = read(userId)
  if (partnerId) prefs.defaultShippingPartnerId = partnerId
  else delete prefs.defaultShippingPartnerId
  write(userId, prefs)
}
