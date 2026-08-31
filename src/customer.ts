export class InvalidCustomerEmailError extends Error {
  readonly code = 'INVALID_CUSTOMER_EMAIL'

  constructor() {
    super('Customer email must be a non-empty string')
    this.name = 'InvalidCustomerEmailError'
  }
}

export function normalizeCustomerEmail(input: unknown): string {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new InvalidCustomerEmailError()
  }

  return input.trim().toLowerCase()
}

