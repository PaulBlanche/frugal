import { Value } from './Form.ts';
import { FormState } from '../../../../dep/frugal/preact.client.ts';
import { Toc } from '../../toc.ts';

export type Data = {
    toc: Toc;
    form: FormState<Value>;
    submitted?: Value;
    serverNow: Date;
};
