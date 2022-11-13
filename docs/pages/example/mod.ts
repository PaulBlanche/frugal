import { getContentFrom } from '../../dep/frugal/preact.server.ts';
import * as frugal from '../../dep/frugal/core.ts';

import { Page } from './Page.tsx';
import { Data, Path } from './type.ts';
import { fromFormData, initial } from './Form.ts';

export function getStaticData(): frugal.DataResult<Data> {
    return {
        data: {
            form: initial().state,
            serverNow: new Date(),
        },
    };
}

export const handlers = {
    POST: async (request: Request): Promise<frugal.DataResult<Data>> => {
        const form = fromFormData(await request.formData());
        const submitted = await form.handle();

        return {
            data: {
                form: form.state,
                submitted,
                serverNow: new Date(),
            },
        };
    },
};

export const pattern = `/example`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page);
