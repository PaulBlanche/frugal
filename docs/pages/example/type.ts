import { Value } from './Form.ts';
import { FormState } from '../../dep/frugal/preact.client.ts';

// deno-lint-ignore ban-types
export type Path = {};
export type Data = {
    form: FormState<Value>;
    submitted?: Value;
    serverNow: Date;
};
