import { Value } from './Form.ts';
import { FormState } from '../../dep/frugal/preact.client.ts';

export type Data = {
    form: FormState<Value>;
    submitted?: Value;
    serverNow: Date;
};
