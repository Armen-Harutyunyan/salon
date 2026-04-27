export function normalizePhone(input?: null | string) {
  const raw = input?.trim() || ''

  if (!raw) {
    return ''
  }

  let hasLeadingPlus = raw.startsWith('+')
  let digits = ''

  for (const char of raw) {
    if (char >= '0' && char <= '9') {
      digits += char
    }
  }

  if (!digits) {
    return ''
  }

  if (!hasLeadingPlus && raw.includes('00')) {
    hasLeadingPlus = raw.trim().startsWith('00')
    if (hasLeadingPlus) {
      digits = digits.slice(2)
    }
  }

  return `${hasLeadingPlus ? '+' : ''}${digits}`
}

export function validatePhone(input?: null | string, options?: { required?: boolean }) {
  const normalized = normalizePhone(input)

  if (!normalized) {
    if (options?.required) {
      throw new Error('Հեռախոսահամարը պարտադիր է')
    }

    return ''
  }

  const digitsOnly = normalized.replace(/\D/g, '')

  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    throw new Error('Հեռախոսահամարը անվավեր է')
  }

  return normalized
}
