# Frugal

[![tag](https://img.shields.io/github/v/tag/PaulBlanche/frugal)](https://deno.land/x/frugal)
[![codecov](https://codecov.io/gh/PaulBlanche/frugal/branch/main/graph/badge.svg?token=F5PV06R9V1)](https://codecov.io/gh/PaulBlanche/frugal)
[![license](https://img.shields.io/github/license/PaulBlanche/frugal)](https://github.com/PaulBlanche/frugal/blob/main/LICENSE)

Frugal is a hybrid static and dynamic site generator that aim to minimize the amount of javascript served thanks to partial hydration :

- _Static pages rendered at build time_: by default frugal produces static html.
- _Server side pages_ render at request time
- _Bring your own framework_: frugal works with any UI framework able to compile to html
- _Manual partial hydration_ for interactive island in pages of you use Preact
- _Form submission client-side or server-side_ for both static and dynamic pages
- _Incremental build_: if both data and code did not change, the page is not rebuilt

## Getting started

Visit https://frugal.deno.dev/docs/getting-started to get started with frugal

## Documentation

Visit https://frugal.deno.dev/docs to get started with frugal

## Why ?

Modern web development is geared toward delivering more Javascript. JSX and client side navigation enabling larger codebase and optimised with code-splitting. Each new optimisation is not used to make web faster, but rather to send more.

Don't get me wrong, those tools and optimisations are fantastic (and Frugal relies on them). But somewhere along the way, we kinda lost ourselves.

The idea is to keep most of the developper experience of thoses tools (JSX, CCS in JS), but ship everything static in html and css and only the dynamic parts in js.

That's the difference betwee Frugal and Next.js for example. Next.js will bundle the whole JSX (even the static parts), and ship it alongside a static rendring in html. So everything static is send twice (one time in the html, and then in uncompressed form in the js bundle), and the browser has to do rendering twice (one time with the html, and then by parsing and executing a JS bundle that mutate the DOM).

With Frugal, we lose the ability to do client side navigation, because the JS does not have all the information to render the pages we navigate to (since only the dynamic parts are in the js), but we make it up by having small cachable pages (so roundtrip to the server a quick and infrequent).

Compared to Next.js, Frugal is less opinionated :

- No file-system based router, you are free to organise your codebase your way.
- Static page refresh is done on demand via webhook, rather than on each visit.
- Frugal is frontend-framework agnostic. As long as you can return a string, Frugal is happy.
- Optional integration with preact.
