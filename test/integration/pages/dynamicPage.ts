import { DataResponse } from '../../../src/page/FrugalResponse.ts';

export const self = import.meta.url;

export const pattern = '/';

export const type = 'dynamic';

export function GET() {
    return new DataResponse({});
}

export function getContent() {
    return 'Hello world';
}
