import { getContentFrom } from '../../dep/frugal/frugal_preact.server.ts';
import * as frugal from '../../dep/frugal/core.ts';

import { Page } from './Page.tsx';
import { Data } from './type.ts';
import { fromFormData, initialForm, submitForm, validateForm } from './Form.ts';

export function getStaticData(): frugal.DataResult<Data> {
    return {
        data: {
            form: initialForm(),
        },
    };
}

export const handlers = {
    POST: async (request: Request): Promise<frugal.DataResult<Data>> => {
        const formData = await request.formData();
        const form = fromFormData(formData);
        const validatedForm = await validateForm(form);
        if (validatedForm.isValid) {
            const submittedForm = await submitForm(form);
            return {
                data: { form: submittedForm },
            };
        }
        return {
            data: { form: validatedForm },
        };
    },
};

export const pattern = `/example`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page);
