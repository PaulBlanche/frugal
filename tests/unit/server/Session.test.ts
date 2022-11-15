import * as djwt from '../../../dep/djwt.ts';
import * as http from '../../../dep/std/http.ts';
import * as time from '../../../dep/std/testing/time.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';
import * as mocks from '../../../dep/std/testing/mock.ts';
import {
    KEY_ALGORITHM,
    KEY_EXTRACTABLE,
    KEY_USAGE,
    Session,
} from '../../../packages/server/Session.ts';

const KEY = await crypto.subtle.generateKey(
    KEY_ALGORITHM,
    KEY_EXTRACTABLE,
    KEY_USAGE,
);

Deno.test('Session: token generation', async () => {
    const session = new Session(KEY, {
        cookieName: 'cookieName',
        persistence: ({} as any),
        frugal: ({} as any),
    });

    session.set('foo', 'bar');

    const creationTime = 10;
    mocks.stub(Date, 'now', () => creationTime * 1000);

    const token = await getToken(session);

    const payload = await djwt.verify(token, KEY);
    asserts.assertEquals(payload, {
        iat: creationTime,
        exp: creationTime + 60 * 60,
        foo: 'bar',
        secret: session.secret,
    });

    mocks.restore();
});

Deno.test('Session: restoration with valid cookie', async () => {
    mocks.stub(Date, 'now', () => 10 * 1000);
    const token = await generateToken({ foo: 'bar' });
    const [_header, originalPayload] = djwt.decode(token);

    mocks.restore();

    const restoreSecond = 100;
    mocks.stub(Date, 'now', () => restoreSecond * 1000);

    const request = new Request('http://example.com');
    request.headers.set('Cookie', `cookieName=${token}`);

    const session = await Session.restore(request, {
        config: {
            session: {
                cookieName: 'cookieName',
                key: KEY,
            },
        } as any,
        frugal: ({} as any),
    });

    const restoredToken = await getToken(session);

    const payload = await djwt.verify(restoredToken, KEY);
    asserts.assertEquals(payload, {
        ...(originalPayload as any),
        exp: restoreSecond + 60 * 60, // new expiration date
    });

    mocks.restore();
});

Deno.test('Session: restoration with expired token', async () => {
    mocks.stub(Date, 'now', () => 10 * 1000);
    const token = await generateToken({ foo: 'bar' });
    const [_header, originalPayload] = djwt.decode(token);

    mocks.restore();

    const restoreSecond = 5000;
    mocks.stub(Date, 'now', () => restoreSecond * 1000);

    const request = new Request('http://example.com');
    request.headers.set('Cookie', `cookieName=${token}`);

    const session = await Session.restore(request, {
        config: {
            session: {
                cookieName: 'cookieName',
                key: KEY,
            },
        } as any,
        frugal: ({} as any),
    });

    const restoredToken = await getToken(session);

    const payload = await djwt.verify(restoredToken, KEY);
    asserts.assertObjectMatch(payload, {
        iat: restoreSecond,
        exp: restoreSecond + 60 * 60,
    });
    asserts.assertNotEquals(payload.secret, (originalPayload as any).secret);
    asserts.assertNotEquals(payload['foo'], 'bar');

    mocks.restore();
});

Deno.test('Session: restoration with invalid token', async () => {
    const token = 'invalid_token';

    const restoreSecond = 5000;
    mocks.stub(Date, 'now', () => restoreSecond * 1000);

    const request = new Request('http://example.com');
    request.headers.set('Cookie', `cookieName=${token}`);

    const session = await Session.restore(request, {
        config: {
            session: {
                cookieName: 'cookieName',
                key: KEY,
            },
        } as any,
        frugal: ({} as any),
    });

    const restoredToken = await getToken(session);

    const payload = await djwt.verify(restoredToken, KEY);
    asserts.assertObjectMatch(payload, {
        iat: restoreSecond,
        exp: restoreSecond + 60 * 60,
    });

    mocks.restore();
});

Deno.test('Session: restoration with no cookie', async () => {
    const restoreSecond = 5000;
    mocks.stub(Date, 'now', () => restoreSecond * 1000);

    const request = new Request('http://example.com');

    const session = await Session.restore(request, {
        config: {
            session: {
                cookieName: 'cookieName',
                key: KEY,
            },
        } as any,
        frugal: ({} as any),
    });

    const restoredToken = await getToken(session);

    const payload = await djwt.verify(restoredToken, KEY);
    asserts.assertObjectMatch(payload, {
        iat: restoreSecond,
        exp: restoreSecond + 60 * 60,
    });

    mocks.restore();
});

async function generateToken(
    extra: Record<string, string | number | boolean> = {},
) {
    const session = new Session(KEY, {
        cookieName: 'cookieName',
        persistence: ({} as any),
        frugal: ({} as any),
    });

    for (const [key, value] of Object.entries(extra)) {
        session.set(key, value);
    }

    return getToken(session);
}

async function getToken(session: Session) {
    const response = new Response();
    await session.attach(response);

    const cookies = http.getSetCookies(response.headers);
    const sessionCookie = cookies.find((cookie) => cookie.name = 'cookieName');

    return sessionCookie!.value;
}
