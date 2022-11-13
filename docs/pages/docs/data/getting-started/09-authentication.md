# Authentication

## Login form

In a page descriptor (`/pages/login.ts` for example), we will create our login form :

```ts
import type * as frugal from 'https://deno.land/x/frugal/core.ts';
import { queryPost, queryPostList } from './api.ts';
import { post } from './component/post.ts';

export const pattern = '/login';

type Form = {
    error?: string;
    username: string;
    password: string;
};

export async function getStaticData(
    context: frugal.GetStaticDataContext<{}>,
): Promise<frugal.DataResult<Form>> {
    return {
        data: {
            username: '',
            password: '',
        },
    };
}

export function getContent({ data }: frugal.GetContentParams<{}, Form>) {
    return `<html>
        <body>
            <form encType='multipart/form-data' method='POST'>
                ${data.error ? `<p>${data.error}</p>` : ''}
                <input type="text" name="username" />
                <input type="password" name="password" />
                <button>Login</button>
            </form>
        </body>
    </html>`;
}

export const self = new URL(import.meta.url);
```

## Login form submission

In our page descriptor, we must add a `handlers` with `POST` method to handle the login form submission :

```ts
import { setCookie } from "http://deno.land/std/http/cookie.ts";
import { isLoggedIn, getAccessToken } from './login.ts'
//...

export const handlers = {
    POST: (request: Request, context: frugal.GetDynamicDataContext<{}>) => {
        const formData = await request.formData();
        const username = formData.get('username') ?? '';
        const password = formData.get('password') ?? '';
        if (isLoggedIn(username, password)) {
            const token = getAccessToken(username, password);
            const headers = new Headers();
            setCookie(headers, {
                name: "accessToken",
                value: token
                sameSite: "Lax",
                path: "/",
                secure: true,
                httpOnly: true,
            })
            return {
                status: 303,
                headers,
            };
        } else {
            return {
                data: {
                    error: 'username or password incorrect'
                    username,
                    password,
                },
            };
        }
    },
};
```

When the user submit the form, we check if the username and password matches and we issue a unique access token for this user and send it as a secure cookie. Methods `isLoggedin` and `getAccessToken` will depend on your use case (stored hashed password, OAuth, ...)

## Authentication middleware

Now we need to make every page descriptor aware if the user has a valid access token. We can do that using a middleware. To register a middleware, we will have to replace the `serve` function :

```ts
import { config } from './frugal.config.ts';
import { FrugalServerBuilder } from 'https://deno.land/x/frugal/server.ts';

const builder = new FrugalServerBuilder(config);

const instance = await builder.load();

instance.use((context, next) => {
    //...
});

await instance.listen();
```

In the authentication middleware, we want to read the header of the request, validate the access token in the cookie if it exists, and pass the information to the page descriptor :

```ts
import { getCookie } from 'http://deno.land/std/http/cookie.ts';
import { isValidateAccessToken } from './login.ts';

//...

instance.use((context, next) => {
    const cookies = getCookies(req.headers);
    const accessTokenCookie = cookies['accessToken'];

    // everything in `context.state` will be passed to dynamic data fetching method of page descriptors
    context.state.authenticated = accessTokenCookie !== undefined &&
        isValidateAccessToken(accessTokenCookie.value);

    return next(context);
});
```

## Protected page

We can now protect some pages :

```ts
import type * as frugal from 'https://deno.land/x/frugal/core.ts';
import { queryPost, queryPostList } from './api.ts';
import { post } from './component/post.ts';

export const pattern = '/protected';

export async function getDynamicData(
    request: Request,
    context: frugal.GetStaticDataContext<{}>,
): Promise<frugal.DataResult<{ message: string }>> {
    if (!context.state.authenticated) {
        return { status: 403 };
    }
    return { data: { message: 'This is a protected page' } };
}

export function getContent({ data }: frugal.GetContentParams<{}, Form>) {
    return `<html>
        <body>
            <p>${data.message}</p>
        </body>
    </html>`;
}

export const self = new URL(import.meta.url);
```

Before fetching data, the `getDynamicData` method checks the `context.state` for the `authenticated` property and sends a `403` is the user was not authenticated.
