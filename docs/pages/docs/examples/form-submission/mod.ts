import { getContentFrom } from '../../../../dep/frugal/preact.server.ts';
import * as frugal from '../../../../dep/frugal/core.ts';

import { Page } from './Page.tsx';
import { Data } from './type.ts';
import { fromFormData, initial } from './Form.ts';
import { Toc } from '../../toc.ts';

const TOC: Toc = JSON.parse(
    await Deno.readTextFile(
        new URL('../../data/toc.json', import.meta.url).pathname,
    ),
);

export function getDynamicData(
    _request: Request,
    { state }: frugal.GetDynamicDataContext,
): frugal.DataResult<Data> {
    return {
        data: {
            toc: TOC,
            form: initial(state.csrf as string).state,
            serverNow: new Date(),
        },
    };
}

export const handlers = {
    POST: async (
        request: Request,
        { state }: frugal.GetDynamicDataContext,
    ): Promise<frugal.DataResult<Data>> => {
        const form = fromFormData(
            await request.formData(),
            state.csrf as string,
        );
        const submitted = await form.handle();

        return {
            data: {
                toc: TOC,
                form: form.state,
                submitted,
                serverNow: new Date(),
            },
        };
    },
};

export const pattern = `/docs/examples/form-submission`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page);