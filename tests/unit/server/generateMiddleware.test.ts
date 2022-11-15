import * as http from '../../../dep/std/http.ts';
import * as mock from '../../../dep/std/testing/mock.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';

import { generateMiddleware } from '../../../packages/server/middleware/dynamicPageMiddleware/generateMiddleware.ts';
import { RouterContext } from '../../../packages/server/middleware/types.ts';
import { compute } from '../../../packages/server/etag.ts';

Deno.test('generateMiddleware: generate return the expected response', async () => {
    const generated = {
        pagePath: '',
        content: 'page-content',
        headers: {
            page: 'header',
        },
    };

    const response = await generateMiddleware({
        request: new Request('http://foo.bar'),
        route: {
            generator: {
                generate: mock.spy(async () => generated),
            },
        },
    } as unknown as RouterContext);

    asserts.assertEquals(await response.text(), generated.content);
    asserts.assertEquals(response.status, http.Status.OK);
    asserts.assertEquals(response.statusText, http.STATUS_TEXT[http.Status.OK]);
    asserts.assertEquals(Array.from(response.headers.entries()), [
        ['content-type', 'text/html; charset=utf-8'],
        ['etag', compute(generated.content)],
        ...Object.entries(generated.headers),
    ]);
});

Deno.test('generateMiddleware: headers can be overwritten', async () => {
    const generated = {
        pagePath: '',
        content: 'page-content',
        headers: {
            'content-type': 'foo',
            'etag': 'bar',
        },
    };

    const response = await generateMiddleware({
        request: new Request('http://foo.bar'),
        route: {
            generator: {
                generate: mock.spy(async () => generated),
            },
        },
    } as unknown as RouterContext);

    asserts.assertEquals(Array.from(response.headers.entries()), [
        ...Object.entries(generated.headers),
    ]);
});

Deno.test('generateMiddleware: return naked status', async () => {
    const generated = {
        status: http.Status.NotFound,
        headers: {
            'foo': 'bar',
        },
    };

    const response = await generateMiddleware({
        request: new Request('http://foo.bar'),
        route: {
            generator: {
                generate: mock.spy(async () => generated),
            },
        },
    } as unknown as RouterContext);

    asserts.assertEquals(await response.text(), '');
    asserts.assertEquals(response.status, generated.status);
    asserts.assertEquals(
        response.statusText,
        http.STATUS_TEXT[generated.status],
    );
    asserts.assertEquals(Array.from(response.headers.entries()), [
        ...Object.entries(generated.headers),
    ]);
});
