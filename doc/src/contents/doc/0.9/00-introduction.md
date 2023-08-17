# Introduction

## What is frugal?

Frugal is born from the frustration of loading modern websites on bad data connections. On slow connections, you have to wait for a 1Mo JS bundle to be able to interact with the page. It's double jeopardy for older devices because once the bundle is downloaded, you must wait for the JS to be parsed and executed.

Frugal is a **web framework** that gives you the tools and the structure **to build lighter, leaner, simpler websites** without sacrificing DX :

- At build time, frugal generates static assets (static html, js, CSS, etc ...)
- At runtime, frugal serves static assets and generates dynamic HTML

If you are familiar with the MVC pattern, Frugal wants you to define Controllers. Views and Models are your responsibility with your framework of choice (Preact for Views and Prisma for Models, for example).

## Key features

- **Static pages without JS by default** : Frugal defaults to the fastest way to serve content.
- **Server generated pages** : When you need pages tailored to user requests.
- **Client-side scripts** : use scripts to run code in the browser and hydrate client-side islands with Preact or Svelte (more to come).
- **Incremental build** : if both data and code for a page do not change, it is not rebuilt.
- **Framework agnostic** : Frugal works with any UI framework able to compile to HTML.
- **Extensible** : Create plugins and export to different platforms; Frugal is built as a core you can extend.
