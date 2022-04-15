import { getContentFrom } from '../../dep/frugal/frugal_preact.server.ts';
import * as frugal from '../../dep/frugal/core.ts';
import * as oak from '../../dep/oak.ts';

import { App } from '../App.tsx';
import { Page } from './Page.tsx';
import { Data, Request } from './type.ts';
import { fromFormData, initialForm, submitForm, validateForm } from './Form.ts';

export function getRequestList(): Request[] {
    return [{}];
}

export function getStaticData(): Data {
    return {
        form: initialForm(),
    };
}

export async function postDynamicData(
    { body }: frugal.PostDynamicDataParams<Request, oak.BodyFormData>,
): Promise<Data> {
    const formDataBody = await body.value.read();
    const form = fromFormData(formDataBody);
    console.log(form);
    const validatedForm = await validateForm(form);
    if (validatedForm.isValid) {
        const submittedForm = await submitForm(form);
        return { form: submittedForm };
    }
    return {
        form: validatedForm,
    };
}

export const pattern = `/`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page, { App });
