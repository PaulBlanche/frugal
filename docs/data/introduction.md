# Introduction

Frugal is born from the frustration of trying to load some modern website on a bad data connection. On a slow connection you have to wait for a 1Mo JS bundle to be able to interact with the page. For older devices it's double jeopardy, because once the bundle is downloaded you now have to wait for the js to be parsed and executed.

With modern web developpment tools, we tend to put things in our JS bundle : static markup, CSS-in-JS, svg. The _everything-in-JS_ paradigm comes with great DX, but without care we offload in js work that should be done natively by the browser (html parsing, styles, caching, navigation, ...).

The philosophy of frugal is to keep most of the DX offered by modern web developpment tools, strip the JS from what should not be executed as JS, and rely on native browser mechanisms. [Learn more about it](#)

## Static pages

By default, frugal produces static web page. You provide the data fetching logic, you describe the page with your UI framework of choice that can output static html and frugal outputs a folder ready to be served by a web server like NGINX.

Frugal also comes with an optionnal server able to serve this content if needed (for plateforms like [Deno Deploy](https://deno.com/deploy)).

If you use frugal server, you can trigger static page refresh via webhook. If the underlying data for a page changes, you can ask the server to rebuild only this page. The new page will be added to the static cache, and served like any other static page.

## Dynamic pages

With frugal server you can also do server-side render at request time. You provide the data fetching logic, you describe the page with your UI framework of choice that can output static html and frugal will generate pages on demand. Data fetching will be done each time the page is requested.

## Bring your own framework

You can use frugal with any UI framework able to render static html. Frugal comes with an optional [Preact](https://preactjs.com/) integration.

## Partial hydration

By default, even with [Preact](https://preactjs.com/) integration, pages generated with frugal (be it static or dynamic) will contain no javascript. The preact code is executed server side only. If you want client-side interactivity, the [Preact](https://preactjs.com/) integration allows you to declare parts of your page as _interactive islands_. Code for those _islands_ will be bundled and delivered for client-side interactivity.

## Form submission

For static or dynamic page, frugal server is able to handle native form submission via POST, PUT, PATCH or DELETE request. Frugal will use POST-redirect-GET pattern to serve the dynamically generated result of a form submission (this means that the user hitting back after a form submission will not trigger a resubmit).
This feature in combination with Partial hydration allow you to do _isomorphic form submision_ :

- You write the code doing form validation and submission once. You use it both in an _island_ (client side), and in response to a `POST` (server side)
- Recent browser recieve the _islands_ bundle and are able to execute it, so you can do client-side form validation and submission.
- Older browser unable to execute the bundle fallback on native form submission. Frugal executes server-side the form validation and submission.

## Incremental build

Frugal keep track of what's been built and why. Frugal will rebuild a page only if the data or the underlying code has changed since last build.
