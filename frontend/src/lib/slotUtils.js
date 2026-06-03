const HOURS = Array.from({ length: 10 }, (_, i) => i + 8) // 8am–5pm (last slot 5:00–6:00)

export function buildWeekSlots(weekStart) {
  const slots = []
  for (let d = 0; d < 7; d++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + d)
    const dateStr = toISODate(date)
    for (const hour of HOURS) {
      slots.push({ date: dateStr, hour, key: slotKey(dateStr, hour) })
    }
  }
  return slots
}

export function slotKey(date, hour) {
  return `${date}T${String(hour).padStart(2, '0')}:00`
}

export function slotToLabel(key) {
  const [datePart, timePart] = key.split('T')
  const date = new Date(datePart + 'T12:00:00') // noon to avoid DST shift
  const hour = parseInt(timePart.split(':')[0], 10)
  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const startH = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  const endHour = hour + 1
  const endH = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour
  const startSuffix = hour < 12 ? 'am' : 'pm'
  const endSuffix = endHour < 12 ? 'am' : 'pm'
  return `${dayLabel}, ${startH}${startSuffix}–${endH}${endSuffix}`
}

export function slotToObj(key) {
  const [date, timePart] = key.split('T')
  const hour = parseInt(timePart.split(':')[0], 10)
  const endHour = hour + 1
  return {
    date,
    start: `${String(hour).padStart(2, '0')}:00`,
    end: `${String(endHour).padStart(2, '0')}:00`,
  }
}

export function objToKey(slot) {
  return `${slot.date}T${slot.start}`
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

export function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatWeekRange(weekStart) {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const opts = { month: 'short', day: 'numeric' }
  return `${weekStart.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

export const HOURS_LIST = HOURS
