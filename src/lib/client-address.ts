export function getClientAddress(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for')?.trim()

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return headers.get('x-real-ip')?.trim() || 'unknown'
}
