# Authentication

For authentication, you'll need to use [Server Session](/doc@{{FRUGAL_VERSION}}/reference/server#heading-session) and [Server Middlewares](/doc@{{FRUGAL_VERSION}}/reference/server#heading-middlewares).

## Login page

Let's build the login page with native form submission :

```ts
import {
    DataResponse,
    DynamicHandlerContext,
    EmptyResponse,
    RenderContext,
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export const route = "/login";

type Data = {
    error?: string;
    username: string;
    password: string;
};

export async function GET({ session }: DynamicHandlerContext<typeof route>) {
    const accessToken = session.get("accessToken");

    if (accessToken !== undefined) {
        // user is already authenticated, redirect to home page
        return new EmptyResponse({
            status: 303,
            headers: {
                "Location": "/",
            },
        });
    }

    const error = session.get("error");
    return new DataResponse({
        error,
        username: "",
        password: "",
    });
}

export async function POST({ session }: DynamicHandlerContext<typeof route>) {
    const formData = await request.formData();
    const username = formData.get("username") ?? "";
    const password = formData.get("password") ?? "";

    const accessToken = authenticate(username, password);
    if (accessToken === undefined) {
        session.set("error", "invalid password or username");
        // failed authentication, redirect to login page
        return new EmptyResponse({
            status: 303,
            headers: {
                "Location": request.url,
            },
        });
    } else {
        session.set("accessToken", accessToken);
        // successful authentication, redirect to home page
        return new EmptyResponse({
            status: 303,
            headers: {
                "Location": "/",
            },
        });
    }
}

export function render({ data }: RenderContext<typeof route, Data>) {
    return `<!DOCTYPE html>
<html>
    <body>
        <form encType='multipart/form-data' method='POST'>
            ${data.error ? `<p>${data.error}</p>` : ""}
            <input type="text" name="username" />
            <input type="password" name="password" />
            <button>Login</button>
        </form>
    </body>
</html>`;
}
```

> [!warn]
> We store an `accessToken` in the session. If you use `CookieSessionStorage`, it will be stored **unencrypted** in the client browser.

The login page has multiple functionality :

- If the user is already logged in, it redirects to the homepage
- If the user is not logged in, it displays a login form
- On form submission with a valid password and username, it redirects to the homepage
- On form submission with an invalid password and username, it redirects to the login page with an error message

## Restrict access to some pages

You could restrict access to some pages with a check to the `accessToken` in the `GET` method, but that would mean :

- extra duplicate code in each restricted page
- static pages won't be restricted, because they don't have a `GET` method

The best way to handle this situation is to use a `Server Middleware` :

```ts
import { Context, Next } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

const restrictedPages = ["/private"];

export function accessRestrictedPages(context: Context, next: Next<Context>) {
    const url = new URL(context.request.url);

    if (!restrictedPages.includes(url.pathname)) {
        return next(context);
    }

    const accessToken = context.session.get("accessToken");

    if (!isValidAccessToken(accessToken)) {
        return new Response("Forbidden", {
            status: 401,
        });
    }

    return next(context);
}
```

Don't forget to [register the middleware](/doc@{{FRUGAL_CONFIG}}/reference/configuration#heading-middlewares) in your config

In this middleware :

- if the URL is not restricted, we delegate to the next middleware
- if the URL is protected, we check the access token
- if the access token is invalid, we directly answer with a 401 (we could also redirect to a custom 401 page)
- if the access token is valid, we delegate to the next middleware

That way, if the page is restricted, it can only be accessed with a valid access token that was obtained via the login page.
