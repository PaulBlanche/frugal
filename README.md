# Frugal

Frugal is a hybrid static and dynamic site generator that aim to minimize the amount of javascript served thanks to partial hydration.

## Why ?

Modern web development is geared toward delivering more Javascript. JSX and client side navigation enabling larger codebase and optimised with code-splitting. Each new optimisation is not used to make web faster, but rather to send more.

Don't get me wrong, those tools and optimisations are fantastic (and Frugal relies on them). But somewhere along the way, we kinda lost ourselves.

The idea is to keep most of the developper experience of thoses tools (JSX, CCS in JS), but ship everything static in html and css and only the dynamic parts in js.

That's what differentiate Frugal from Next.js for example. Next.js will bundle the whole JSX (even the static parts), and ship it alongside a static rendring in html. So everything static is send twice (one time in the html, and then in uncompressed form in the js bundle), and the browser has to do rendering twice (one time with the html, and then by parsing and executing a JS bundle hat mutate the DOM).

With Frugal, we lose the ability to do client side navigation, because the JS does not have all the information to render the pages we navigate to (since only the dynamic parts are in the js), but we make it up by having small cachable pages (so roundtrip to the server a quick and infrequent).

Compared to Next.js, Frugal is less opinionated :

- No file-system based router, you are free to organise your codebase your way.
- Static page refresh is done on demand via webhook, rather than on each visit
- Frugal is frontend-framework agnostic. As long as you can return a string, Frugal is happy.
- Optional integration with preact.

## Getting started

This project uses [Taskfile](https://taskfile.dev/#/), so you will need to install it to run commands :

- `task fmt` will format the codebase
- `task test` will run all test
- `task coverage` will compile all coverage information from test run
- `task example -- path/to/example/mod.ts`will run one of the example

You can dive in the examples :

- `examples/basic/mod.ts` is the barebone usage of Frugal.
- `examples/script_loader/mod.ts` illustrate the usage of the script loader (bundling and code splitting)
- `examples/preact/mod.ts` illustrate the optional integration with preact

## Principles

### Page Descriptor

In a similar fashion to Next.js, each page is described by a js module exporting some key functions.

#### Static Page

For a static page, you will have :

- a `getRequestList` function that will return the list of _request object_ that will be used to generate each page. A list of ids and locale for example.
- a `pattern` string export, that will be used to generate the url of the page from the _request object_ with `path-to-regexp`
- a `getStaticData` function that will return the _data object_ necessary to render the page for a given _request object_
- a `getContent` function that will return the rendered page as a string given a _data object_

#### Dynamic Page

For a dynamic page, you will have :

- a `pattern` string export, that will be used to generate the server route, and to extract the _request object_ from the url
- a `getDynamicData` function that will return the _data object_ necessary to render the page for a given _request object_
- a `getContent` function that will return the rendered page as a string given a _data object_

### Loaders

Frugal considers that everything returned by `getContent` is static html. If you want to generate assets associated to the html (css or js), you will need loaders.

A loader will analyse all imports, and use those matching a `test` function to generate the assets.

In the example `examples/script_loader/mod.ts`, we configure the _script loader_ to use every imports `.script.ts`.

#### Script Loader

This loader will bundle together all imports matching its `test` function with rollup. This loader will also do code splitting. By default the bundle will use `esm` (not compatible with older browsers). If you want larger support, the loader is able to output `systemjs` bundles.

### Style Loader

This loader will generate a unique css file generated from all imports matching its `test` function. This import must use the `styled` function (a mimic of `styled-components`), that will generate _class names_ (opposite to `styled-components` who produces _components_). Since this loader generate a static css file, you can't have dynamic css (like in `styled-components`). You have to relie on conditionnaly applying _class names_, or raw `style` attributes.

#### SVG Loader

This loader will generate multiple svg spritesheet from imports matching its `test` function. This loader is usefull if you want to have some SVG in your codebase as JSX. Since this loader generate static svg files, you can't have dynamic SVG. If you need dynamic SVG, those must be excluded from the loader (and they will be bundled by the _script loader_)
