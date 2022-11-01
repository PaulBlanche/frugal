import * as mock from '../../../dep/std/mock.ts';
import * as asserts from '../../../dep/std/asserts.ts';

import {
    composeMiddleware,
} from '../../../packages/server/composeMiddleware.ts';
import { Middleware } from '../../../packages/server/types.ts';

type TestContext = { middleware1?: boolean; middleware2?: boolean };

Deno.test('composeMiddleware: compose in the right order', async () => {
    const beforeMiddleware1 = mock.spy();
    const afterMiddleware1 = mock.spy();
    const middleware1Response = new Response('middleware1');
    const middleware1: Middleware<TestContext> = async (context, next) => {
        beforeMiddleware1(context);
        const response = await next({ ...context, middleware1: true });
        afterMiddleware1(response);
        return middleware1Response;
    };

    const beforeMiddleware2 = mock.spy();
    const afterMiddleware2 = mock.spy();
    const middleware2Response = new Response('middleware1');
    const middleware2: Middleware<TestContext> = async (context, next) => {
        beforeMiddleware2(context);
        const response = await next({ ...context, middleware2: true });
        afterMiddleware2(response);
        return middleware2Response;
    };

    const composedMiddleware = composeMiddleware(middleware1, middleware2);

    const baseResponse = new Response('initial');
    const base = mock.spy(async (context) => {
        return baseResponse;
    });

    const context: TestContext = {};
    const response = await composedMiddleware(context, base);

    asserts.assertStrictEquals(response, middleware1Response);
    mock.assertSpyCall(beforeMiddleware1, 0, { args: [context] });
    mock.assertSpyCall(beforeMiddleware2, 0, {
        args: [{ ...context, middleware1: true }],
    });
    mock.assertSpyCall(base, 0, {
        args: [{ ...context, middleware1: true, middleware2: true }],
    });
    mock.assertSpyCall(afterMiddleware2, 0, { args: [baseResponse] });
    mock.assertSpyCall(afterMiddleware1, 0, { args: [middleware2Response] });
});
