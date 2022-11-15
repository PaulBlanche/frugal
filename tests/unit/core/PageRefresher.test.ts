import { fakePageBuilder } from './__fixtures__/PageBuilder.ts';
import { fakeStaticPage } from './__fixtures__/Page.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';
import {
    assertSpyCallArgs,
    assertSpyCalls,
} from '../../../dep/std/testing/mock.ts';

import { PageRefresher } from '../../../packages/core/PageRefresher.ts';

Deno.test('PageRefresher: refresh call builder.build with parsed request', async () => {
    const page = fakeStaticPage({
        pattern: 'foo/:id',
    });

    const pagePath = 'pagePath';
    const builder = fakePageBuilder({
        mock: {
            build: () => Promise.resolve(pagePath),
        },
    });

    const refresher = new PageRefresher(page, builder);

    const result = await refresher.refresh('foo/345');

    asserts.assertEquals(result, pagePath);

    assertSpyCalls(asSpy(builder.build), 1);
    assertSpyCallArgs(asSpy(builder.build), 0, [{ id: '345' }, 'refresh']);
});

Deno.test('PageRefresher: throws if path does not match', async () => {
    const page = fakeStaticPage({
        pattern: 'foo/:id',
    });

    const builder = fakePageBuilder();

    const refresher = new PageRefresher(page, builder);

    await asserts.assertRejects(async () => {
        await refresher.refresh('bar/345');
    });
});
