# Introduction

Frugal is born from the frustration of trying to load some modern website on bad data connections. On slow connections, you have to wait for a 1Mo JS bundle to be able to interact with the page. For older devices, it's double jeopardy, because once the bundle is downloaded, you have to wait for the JS to be parsed and executed.

With modern web development tools, we tend to put things like static markup, CSS-in-JS, and SVG in our JS bundle. The _everything-in-JS_ paradigm comes with great DX, but without care we offload in JS work that should be done natively by the browser (HTML parsing, styles, caching, etc.) or the server (navigation, static markup generation, etc.).

The philosophy of Frugal is to keep most of the DX offered by modern web development tools, strip the JS from what should not be executed as JS, and rely on native browser mechanisms.

## Static pages

By default, Frugal produces static web page. You provide the data fetching logic, you describe the page with your UI framework of choice that can output static html and Frugal outputs a folder ready to be served by a web server like NGINX.

Frugal also comes with an optional server able to serve this content if needed (for platforms like [Deno Deploy](https://deno.com/deploy)).

If you use Frugal server, you can trigger static page refresh via webhook. If the underlying data for a page changes, you can ask the server to rebuild only this page. The new page will be added to the static cache, and served like any other static page.

## Dynamic pages

With the server you can also do server-side render at request time. You provide the data fetching logic, you describe the page with your UI framework of choice that can output static html and Frugal will generate pages on demand. Data fetching will be done each time the page is requested.

## Bring your own framework

You can use Frugal with any UI framework able to render static html. Frugal comes with an optional [Preact](https://preactjs.com/) integration.

## Partial hydration

By default, even with [Preact](https://preactjs.com/) integration, pages generated with Frugal (static or dynamic) will not contain any JavaScript. Preact code is only executed on the server side. If you want client-side interactivity, [Preact](https://preactjs.com/) integration allows you to declare parts of your page as _interactive islands_. Code for those _islands_ will be bundled and delivered for client-side interactivity.

## Form submission

For static or dynamic page, Frugal's HTTP server is able to handle native form submission via POST, PUT, PATCH or DELETE request with CSRF protection. Frugal uses POST-redirect-GET pattern to serve the dynamically generated result of a form submission (this means that the user hitting back after a form submission will not trigger a resubmit)
In combination with partial hydration, this feature allows you to do _isomorphic form submission_:

- You write the code doing form validation and submission once. You use it both in an _island_ (client-side), and in response to a `POST` (server-side).
- Recent browser receive the _islands_ bundle and are able to execute it, so you can do client-side form validation.
- Older browser unable to execute the bundle fallback on native form submission. On the server side, Frugal executes the form validation.

## Incremental build

Frugal keep track of what's been built and why. Frugal will rebuild a page only if the data or the underlying code has changed since last build.

## Client session

Frugal can hijack the native navigation of the browser to preserve the JavaScript context. You get the SPA (Single Page Application) user experience with an MPA (Multi-Page Application) codebase.
