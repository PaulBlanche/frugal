export class FrugalError extends Error {
    override name = 'FrugalError';
    constructor(message: string) {
        super(message);
    }
}
