import * as http from '../../../dep/std/http.ts';
import * as mock from '../../../dep/std/mock.ts';
import * as asserts from '../../../dep/std/asserts.ts';

import { generateMiddleware } from '../../../packages/frugal_server/middleware/dynamicPageMiddleware/generateMiddleware.ts';
import { RouterContext } from '../../../packages/frugal_server/middleware/types.ts';
import { compute } from '../../../packages/frugal_server/etag.ts';

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
    asserts.assertEquals(await response.status, http.Status.OK);
    asserts.assertEquals(
        await response.statusText,
        http.STATUS_TEXT[http.Status.OK],
    );
    asserts.assertEquals(Array.from(response.headers.entries()), [
        ['content-type', 'text/html; charset=utf-8'],
        ['etag', compute(generated.content)],
        ...Object.entries(generated.headers),
    ]);
});
