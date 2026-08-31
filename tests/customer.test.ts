import { describe, expect, it } from 'vitest'
import { InvalidCustomerEmailError, normalizeCustomerEmail } from '../src/customer.js'

describe('normalizeCustomerEmail', () => {
  it('normalizes valid email addresses', () => {
    expect(normalizeCustomerEmail('  PERSON@EXAMPLE.COM ')).toBe('person@example.com')
  })

  it('rejects empty values with a safe domain error', () => {
    expect(() => normalizeCustomerEmail('')).toThrow(InvalidCustomerEmailError)
  })
})

