export function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function initialsShortName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  const first = parts[0]
  const last  = parts.length > 1 ? parts[parts.length - 1] : ''
  return last ? `${first} ${last[0].toUpperCase()}.` : first
}

export function spiritualDisplayName(member) {
  const realName = String(member?.name || '').trim()
  if (!realName) return ''
  const spiritual = String(member?.spiritualName || '').trim()
  const gender    = (member?.gender || '').toLowerCase()
  const prefix    = gender === 'male' ? 'Bro.' : gender === 'female' ? 'Sis.' : ''
  if (!spiritual) return prefix ? `${prefix} ${realName}` : realName
  const base = `${spiritual} (${realName})`
  return prefix ? `${prefix} ${base}` : base
}

/** Returns { top, bottom } for two-line tile display */
export function spiritualTileLines(member) {
  const realName = String(member?.name || '').trim()
  const spiritual = String(member?.spiritualName || '').trim()
  const gender    = (member?.gender || '').toLowerCase()
  const prefix    = gender === 'male' ? 'Bro.' : gender === 'female' ? 'Sis.' : ''
  const topName   = spiritual || realName
  const top       = topName ? (prefix ? `${prefix} ${topName}` : topName) : ''
  const bottom    = spiritual && realName ? realName : ''
  return { top, bottom }
}

export function formatHeaderTime(date) {
  return date.toLocaleTimeString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
}

export function formatTimestamp(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function avatarUrl(id) {
  return `https://i.pravatar.cc/160?u=${encodeURIComponent(id)}`
}
