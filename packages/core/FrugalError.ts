export class FrugalError extends Error {
    override name = 'FrugalError';
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
    }
}
