import { getContentFrom } from '../../dep/frugal/frugal_preact.server.ts';
import * as frugal from '../../dep/frugal/core.ts';
import * as oak from 'oak';

import { App } from '../App.tsx';
import { Page } from './Page.tsx';
import { Data, Path } from './type.ts';
import { fromFormData, initialForm, submitForm, validateForm } from './Form.ts';

export function getPathList(): Path[] {
    return [{}];
}

export function getStaticData(): Data {
    return {
        form: initialForm(),
    };
}

export async function postDynamicData(
    { request }: frugal.PostDynamicDataParams<Path, oak.BodyFormData>,
): Promise<Data> {
    const body = request.body;
    const formDataBody = await body.value.read();
    const form = fromFormData(formDataBody);
    const validatedForm = await validateForm(form);
    if (validatedForm.isValid) {
        const submittedForm = await submitForm(form);
        return { form: submittedForm };
    }
    return {
        form: validatedForm,
    };
}

export const pattern = `/example`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page, { App });
