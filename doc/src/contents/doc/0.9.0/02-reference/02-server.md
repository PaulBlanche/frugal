# Server

Frugal comes with a server, depending on the kind of [Exporter](@@@) you use: Exporters that produces static website will not use the server.

## Dynamic pages

All dynamic handlers `GET`, `POST`, `PUT`, `PATCH` and `DELETE` receive some extra values from the server :

- the `Request` object
- the `state` object that any middleware can manipulate to pass data to pages
- the `session` object containing the user's current session.

## Static pages

The server offers some nice features besides serving static pages from caches.

### Page Refresh

If you configured the [`cryptoKey`](/doc@{{FRUGAL_VERSION}}/reference/configuration#heading-cryptokey) you will be able to refresh static pages at runtime (if your data source was updated, for example).

To do so, you'll have to send a `GET` request to the static page you want to refresh with some query parameters :

- a `timestamp` parameter containing a UNIX timestamp in milliseconds of the time you made the request
- a `sign` parameter containing a SHA-512 HMAC signature of the `timestamp` with the `cryptoKey` of the server

The page will be refreshed if the signature in `sign` is valid and if the `timestamp` is not older than 2 seconds.

### Just in time build

By default, Frugal [enforces the list of path](/doc@{{FRUGAL_VERSION}}/reference/page-descriptor#heading-with-getpaths-for-static-pages) returned by `getPaths`. But you can disable this behavior with `export const strictPaths = false;` on your page.

By doing so, Frugal will accept paths outside those returned by `getPaths`, and will build the pages when requested for the first time. Frugal will still cache them after build for subsequent requests.

With `strictPaths` you can build only a subset of the possible paths, like the most visited, and let the less visited pages be generated just in time to optimize build time.

```ts
export const route = "/post/:slug";

export const strictPaths = false;

export async function getPaths(): Promise<PathList<typeof route>> {
    const slugs = await getMostVisitedSlug();
    return slugs.map((slug) => ({ slug }));
}
```

### Force dynamic

You can redirect to a static page with an `EmptyResponse` using the `forceDynamic` option to get a [Hybrid Page](/doc@{{FRUGAL_VERSION}}/reference/page-descriptor#heading-hybrid-page) :

```ts
export async function generate({ path: { slug }, session }: HybridHandlerContext<typeof route>) {
    return new DataResponse<Data>({ data: Date.now() });
}

export async function POST({ request, session }: DynamicHandlerContext<typeof route>) {
    return new EmptyResponse<Data>({
        status: 303,
        forceDynamic: true,
        headers: {
            "Location": request.url,
        },
    });
}
```

Calling the page with a `POST` method will redirect to the same URL with a `GET` method. But instead of serving the static page from cache, Frugal will dynamically generate the page this one time (not caching it): you get a freshly generated page from the server. Hitting refresh in the browser will take you back to the cached version (issuing a `GET` request without `forceDynamic`).

In the context of a `forceDynamic` generation, the `generate` method behaves like a dynamic `GET` method.

## CSRF protection

Frugal comes with an optional CSRF middleware. When [correctly configured](/doc@{{FRUGAL_VERSION}}/reference/configuration#heading-csrf), Frugal will run the following process on protected pages :

- Frugal will set in the `state` a `csrf` value containing the CSRF token. You can include it in your markup wherever you wish.
- Frugal will send a CSRF token in a cookie alongside the protected page
- During `POST`, `PUT`, `PATCH` or `DELETE`, Frugal will search the request for either :
  - a form field with the name `csrftoken` (or the name you chose in the configuration)
  - a header with the name `X-CSRFToken` (or the name you chose in the configuration)
- Frugal will compare what it found to the token in the cookie and reject the request if they don't match with a [403 Forbidden](https://developer.mozilla.org/fr/docs/Web/HTTP/Status/403).

```ts
type Data = {
    comments: { name: string; body: string }[];
    csrf: string;
};

function GET({ state }: DynamicHandlerContext<typeof route>) {
    const comments = await queryLastComments();

    return new DataResponse({ data: { csrf: state.csrf, comments } });
}

function POST({ request }: DynamicHandlerContext<typeof route>) {
    const { name, body } = await extractNameAndBodyFromRequest(request);

    await persistCommentInDatabase({ name, body });

    return new EmptyResponse({
        status: 303,
        headers: {
            "Location": request.url,
        },
    });
}

function render({ data }: RenderContext<typeof route, Data>) {
    return `<html>
    <body>
        ${
        data.comments.map((comment) => {
            return `<div>
            <span>${comment.name}</span>
            <p>${comment.body}</p>
        </div>`;
        })
    }

        <form method="POST"/>
            <input name="name" />
            <textarea name="body"></textarea>
            <input type="hidden" value="${data.csrf}"/>
        </form>
    </body>
</html>`;
}
```

If your page is dynamic, you can access the `state` property and therefore can embed the CSRF token in your form in a hidden field. You'll have CSRF protection without needing any client-side javascript.

If your page is static, you cannot access the `state`. You will need some javascript to read the CSRF cookie and inject the field in the form or the header in the request. It means that clients with non-functioning javascript will be systematically rejected.

## Session

Frugal will create a session for each client. Each client gets a cookie with a unique id. The Frugal will use this id to get back the data stored in the [session storage](/doc@{{FRUGAL_VERSION}}/reference/configuration#heading-session).

Frugal comes only with two types of session storage :

- the `CookieSessionStorage` where session data for the user is stored in a cookie.
- the `MemorySessionStorage` where session data is stored in memory.

> [!warn]
> Don't store large data with `CookieSessionStorage` because most browsers have a size limit of 4ko for cookies.

> [!error]
> Use `MemorySessionStorage` only in development. Use `CookieSessionStorage` or your own `SessionStorage` in production.

### Custom session storage

If you want to store session data somewhere else, you will have to write your own `SessionStorage` following this interface :

```ts
interface SessionStorage {
    create(
        headers: Headers,
        data: SessionData,
        expires: number | undefined,
    ): Promise<string> | string;
    get(
        headers: Headers,
        id: string,
    ): Promise<SessionData | undefined> | SessionData | undefined;
    update(
        headers: Headers,
        id: string,
        data: SessionData,
        expires?: number | undefined,
    ): Promise<void> | void;
    delete(headers: Headers, id: string): Promise<void> | void;
}

type SessionData = Record<string, any>;
```

#### `create`

The `create` method will be called when creating a new session with:

- the headers of the response if you need to set some cookies
- the data of the session
- the expiry of the session cookie containing the id

It should return the id of the session.

#### `get`

The `get` method will be called to fetch the data of the session with :

- the headers of the request if you need to read some cookies
- the id of the session

It should return the session data or undefined if no data was found.

#### `update`

The `update` method will be called when updating an existing session with:

- the headers of the response if you need to set some cookies
- the id of the session
- the data of the session
- the expiry of the session cookie containing the id

It should return nothing.

#### `delete`

The `delete` method will be called if the session is deleted before expiration with:

- the headers of the response if you need to set some cookies
- the id of the session

It should return nothing.

## Middlewares

The server is composed of middlewares inspired by [koa](https://koajs.com/). A middleware is a sync or async function that takes a `context` and a `next` async function and returns a `Response`.

```ts
type Middleware<CONTEXT = unknown> = (
    context: CONTEXT,
    next: Next<CONTEXT>,
) => Promise<Response> | Response;
```

The `next` function will delegate to the next middleware in the stack. The current middleware is responsible for forwarding the `context` (or a modified context if needed) to the next middleware. The middleware can choose to answer the request directly (without calling `next`) or delegate to the next middleware and intercept and modify the `Response` :

```ts
function middleware(context: Context, next: Next<Context>) {
    // do something before next middleware in the stack

    // call the next middleware with a modified context, and get the response
    const response = await next({ ...context, myAdditionalValue: "foo" });

    // do something after the next middleware in the stack

    return response;
}
```

The base middleware for Frugal will receive the following context :

```ts
type Context = {
    // the current request
    request: Request;
    // the connection info returned by the server
    connInfo: http.ConnInfo;
    // whether the server is exposed over HTTPS
    secure: boolean;
    // the state object that will be transmitted to dynamic pages
    state: Record<string, unknown>;
    // the current config
    config: FrugalConfig;
    // a router that can find the matching page given a url
    router: Router;
    // whether the server is running in watch mod (for development)
    watchMode: boolean;
    // the cache containing static pages
    cache: RuntimeCache;
    // the session (if frugal was configured for sessions)
    session?: Session;
    // a method to print formatted log bound to a request id
    log: (message:string|Error, { scope: string, level: Level, extra: string });
};

type Level = "error" | "warning" | "info" | "debug" | "verbose"
```
