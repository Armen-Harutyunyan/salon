import { describe, expect, it } from 'vitest'

import { normalizePhone, validatePhone } from '@/lib/phone'

describe('phone helpers', () => {
  it('normalizes punctuation and preserves leading plus', () => {
    expect(normalizePhone(' +374 (91) 123-456 ')).toBe('+37491123456')
  })

  it('converts leading 00 to international format', () => {
    expect(normalizePhone('00374 91 123456')).toBe('+37491123456')
  })

  it('rejects too short numbers', () => {
    expect(() => validatePhone('12345', { required: true })).toThrow('Հեռախոսահամարը անվավեր է')
  })

  it('requires a number when marked as required', () => {
    expect(() => validatePhone('', { required: true })).toThrow('Հեռախոսահամարը պարտադիր է')
  })
})
