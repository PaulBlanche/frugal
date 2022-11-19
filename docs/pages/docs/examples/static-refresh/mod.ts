import { getContentFrom } from '../../../../dep/frugal/preact.server.ts';
import * as frugal from '../../../../dep/frugal/core.ts';

import { Page } from './Page.tsx';
import { Data } from './type.ts';
import { Toc } from '../../toc.ts';

const TOC: Toc = JSON.parse(
    await Deno.readTextFile(
        new URL('../../data/toc.json', import.meta.url).pathname,
    ),
);

export function getStaticData(
    { phase }: frugal.GetStaticDataContext,
): frugal.DataResult<Data> {
    return {
        data: {
            toc: TOC,
            phase,
            serverNow: new Date(),
        },
    };
}

export const pattern = `/docs/examples/static-refresh`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page);
