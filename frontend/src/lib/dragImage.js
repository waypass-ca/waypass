const BASE = 'position:fixed;top:-500px;left:-500px;display:flex;align-items:center;gap:8px;padding:6px 12px 6px 8px;border-radius:10px;background:#fff;border:1px solid rgba(0,0,0,0.1);box-shadow:0 4px 14px rgba(0,0,0,0.15);font-family:system-ui,sans-serif;font-size:12.5px;font-weight:500;color:#1c1c1e;white-space:nowrap;pointer-events:none'

function mount(el) {
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 0)
  return el
}

export function makeCaseDragImage(deceased) {
  const el = document.createElement('div')
  el.style.cssText = BASE
  const initials = (deceased || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') || '?'
  const avatar = document.createElement('div')
  avatar.style.cssText = 'width:26px;height:26px;border-radius:6px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#555;flex-shrink:0'
  avatar.textContent = initials
  const label = document.createElement('span')
  label.textContent = deceased || 'Case'
  el.appendChild(avatar)
  el.appendChild(label)
  return mount(el)
}

export function makeDocDragImage(name, ext) {
  const el = document.createElement('div')
  el.style.cssText = BASE
  const icon = document.createElement('div')
  icon.style.cssText = 'width:22px;height:28px;background:#e8f0fd;border:1px solid rgba(59,130,246,0.2);border-radius:3px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px;flex-shrink:0;position:relative'
  const dog = document.createElement('div')
  dog.style.cssText = 'position:absolute;top:0;right:0;width:7px;height:7px;background:#f8faff;border-left:1px solid rgba(59,130,246,0.2);border-bottom:1px solid rgba(59,130,246,0.2)'
  icon.appendChild(dog)
  const badge = document.createElement('span')
  badge.style.cssText = 'font-size:6.5px;font-weight:700;color:rgba(59,130,246,0.7);letter-spacing:0.03em'
  badge.textContent = ext
  icon.appendChild(badge)
  const label = document.createElement('span')
  label.textContent = name
  el.appendChild(icon)
  el.appendChild(label)
  return mount(el)
}
