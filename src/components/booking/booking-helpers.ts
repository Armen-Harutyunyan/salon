export function getMasterInitials(name?: string | null) {
  const safeName = (name || 'Մասնագետ').trim()

  return safeName
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
