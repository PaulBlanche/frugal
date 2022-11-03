import * as mock from '../../../dep/std/mock.ts';
import * as asserts from '../../../dep/std/asserts.ts';
import {
    NotFound,
    UpstashPersistence,
} from '../../../packages/core/Persistence.ts';

Deno.test('UpstashPersistence: set send the right command', async () => {
    const spyFetch = mock.stub(
        globalThis,
        'fetch',
        () => Promise.resolve(new Response(null, { status: 200 })),
    );

    const persistence = new UpstashPersistence(
        'url',
        'token',
        'namespace',
        '/path/to/root',
    );

    await persistence.set('/path/to/my/content', 'content');

    mock.assertSpyCalls(spyFetch, 1);
    mock.assertSpyCall(spyFetch, 0, {
        args: ['url', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(['set', 'namespace:../my/content', 'content']),
        } as any],
        // cast needed because mock.stub infers types of unstable fetch with a
        // required extra `client` property instead of dom fetch
    });

    spyFetch.restore();
});

Deno.test('UpstashPersistence: set with non 200 throws', async () => {
    const spyFetch = mock.stub(
        globalThis,
        'fetch',
        () => Promise.resolve(new Response(null, { status: 201 })),
    );

    const persistence = new UpstashPersistence(
        'url',
        'token',
        'namespace',
        '/path/to/root',
    );

    await asserts.assertRejects(async () => {
        await persistence.set('/path/to/my/content', 'content');
    });

    spyFetch.restore();
});

Deno.test('UpstashPersistence: read sends the right command', async () => {
    const spyFetch = mock.stub(
        globalThis,
        'fetch',
        () =>
            Promise.resolve(
                new Response('{ "result": "content" }', { status: 200 }),
            ),
    );

    const persistence = new UpstashPersistence(
        'url',
        'token',
        'namespace',
        '/path/to/root',
    );

    const content = await persistence.read('/path/to/my/content');

    mock.assertSpyCalls(spyFetch, 1);
    mock.assertSpyCall(spyFetch, 0, {
        args: ['url', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(['get', 'namespace:../my/content']),
        } as any],
        // cast needed because mock.stub infers types of unstable fetch with a
        // required extra `client` property instead of dom fetch
    });
    asserts.assertEquals(content, 'content');

    spyFetch.restore();
});

Deno.test('UpstashPersistence: read with non 200 throws', async () => {
    const spyFetch = mock.stub(
        globalThis,
        'fetch',
        () => Promise.resolve(new Response(null, { status: 201 })),
    );

    const persistence = new UpstashPersistence(
        'url',
        'token',
        'namespace',
        '/path/to/root',
    );

    await asserts.assertRejects(async () => {
        await persistence.read('/path/to/my/content');
    });

    spyFetch.restore();
});

Deno.test('UpstashPersistence: read with null result throws NotFound', async () => {
    const spyFetch = mock.stub(
        globalThis,
        'fetch',
        () =>
            Promise.resolve(
                new Response('{ "result": null }', { status: 200 }),
            ),
    );

    const persistence = new UpstashPersistence(
        'url',
        'token',
        'namespace',
        '/path/to/root',
    );

    await asserts.assertRejects(
        async () => {
            await persistence.read('/path/to/my/content');
        },
        NotFound,
        'path /path/to/my/content was not found',
    );

    spyFetch.restore();
});
