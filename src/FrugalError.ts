export class FrugalError extends Error {
  override name = 'FrugalError';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class AssertionError extends FrugalError {
  override name = 'AssertionError';

  constructor(message: string, options?: ErrorOptions) {
    super(`assertion error: ${message}`, options);
  }
}
