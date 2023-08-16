There are a lot of JS web frameworks in the wild: Next.js, Remix, Astro, Eleventy ... why add my own to the mix? What can Frugal bring to you that those frameworks don't?

## Frugality

Frugal is born from the frustration of loading some modern websites on bad data connections. On slow connections, you have to wait for a 1Mo JS bundle to be able to interact with the page. It's double jeopardy for older devices because once the bundle is downloaded, you have to wait for the JS to be parsed and executed.

It's triple jeopardy even because we tend to write JS for evergreen browsers and transpile for older browsers. Those older browsers that tend to run on older devices get even more JS to parse and execute.

In my opinion, this is bad for multiple reasons. First for users :

- [Performance and accessibility are related](https://bradfrost.com/blog/post/accessibility-and-low-powered-devices/)
- Older or low-power devices get discarded because they "do not work" given the current state of the web. As developers, we involuntarily participate in [planned obsolescence](https://en.wikipedia.org/wiki/Planned_obsolescence).

We need performance, but there are two ways to achieve it :

- adding more clever code to optimize things. For example, I'd put React Server Components (RSC) in this category.
- removing code

The first option could work but requires that we understand precisely what the clever code is doing, what tradeoff it brings, and the hypothesis it relies on. There is only one way to get it right and many ways to fail.

The second option is way simpler: when you can afford to do less, do less. When you can use the web platform, use it. Frugality!

There are nice side effects for developers:

- JS frameworks are easy to bootstrap but extremely tricky to master. Often they come with [leaky abstractions](https://en.wikipedia.org/wiki/Leaky_abstraction) that require you also to master the underlying level they are supposed to abstract.
- JS frameworks often abstract the web platform away. Junior devs learn the framework's _way-of-doing-things_ rather than the standards.

## What Frugal does

Frugal is more of an engine than a framework to help you output static or dynamic pages. You describe the markup using whatever abstraction you choose (vanilla HTML, templating language, JSX, ...), link assets (CSS, js scripts), and Frugal exports what's needed for your target platform.

This design prevents Frugal from doing overly clever things because it can't assume much from your code. For example, since Frugal doesn't know if you are using a client-side UI framework (like Preact), it can only output a static MPA website by default (which is good because it is the fastest and simpler kind of website).

But Frugal does not forbid _you_ to do clever things if you feel up to it. With _scripts_ and a client-side UI framework, you can add interactivity to static pages with _islands_ and even build a full SPA if you put your whole UI in an _island_. But Frugal can't make it easy for you to do: you'll have to set up client-side navigation by yourself, pick a state manager etc... Frugal only offers the primitives; it's up to you to use them.

Also, Frugal enables you to use simpler tools when needed. Even if you described your interface using JSX and used _islands_ for interactivity, you can still use vanilla _scripts_ for interactivity that does not require heavy DOM manipulation or state management.

## Frugal and other frameworks

First, I won't pretend Frugal is better than any other framework. They are made by people way more competent than me. But none of them is a silver bullet: they work best in specific contexts. And Frugal is no different. Here I'll try to define the context where I think you could use Frugal rather than another framework.

### Next.js / Remix

When you use Next.js, you accept some choices made for you :

- You'll use React
- A core javascript runtime will drive the application
- The whole JSX of the application must be shipped (as a js bundle or a RSC stream) to the client for it to work.

It means that you can accidentaly write inaccessible pages for users on older devices (where javascript won't run, crashes, or execute very slowly, hogging resources) and that the whole page kinda needs to be served twice: once as SSR markup and once as a JS bundle (or RSC stream) to hydrate the entire markup.

Next does many extremely clever things to mitigate those issues, but it can be easy to step outside of the optimal operating point mistakenly.

Those choices make sense if you have a website with a lot of client-side interactivity (like a web app). But for a blog or an e-commerce website, it seems wasteful at best and damaging at worst.

Frugal, in contrast, does not ship any JS by default. And if it sends JS, it sends only what you told it to send (_scripts_ and _islands_ using the UI framework you chose). It means that only the interactive markup is served twice. Everything static is only sent once as HTML (the most efficient way to ship UI to a browser). Also, since you have to split your UI between static content and interactive content with _island_, it is easier to think of them as _enhancement over a working html_ page rather than _what makes the page work_.

Remix shares this idea with Frugal, guiding you toward a functional page without javascript and _enhanced_ with it. But some of the choices stay the same :

- You'll use React
- A core javascript runtime will drive the application
- The whole JSX of the application must be shipped (as a js bundle or a RSC stream) to the client for it to work.

In summary, Frugal might be a tool for you if :

- your markup is primarily static with some interactivity here and there
- you don't want to be locked with React
- you favor progressive enhancement

### Eleventy

Eleventy is a static site generator. It means that each page must be built ahead of time. If you want the page to change at runtime, it must be done client-side.

Frugal can also work as a static site generator, outputting assets and HTML pages (however if your project is entirely a static website, maybe Eleventy will be best suited), but it also comes with an optional server :

- you can have server-rendered pages generated depending on the incoming request
- you can have pages react to other HTTP methods like POST or PUT

In summary, Frugal might be a tool for you if :

- your website needs some server-rendered pages

### Astro

Frugal is super close to what Astro proposes in terms of functionality, with some minor differences :

- Astro comes with its own templating language. Islands can mix and match client-side UI framework
- Astro is capable of streaming SSR
- Astro uses file-based routing

Apart from the streaming SSR, the differences are mostly a matter of personal preferences.

In summary, Frugal might be a tool for you if :

- you don't need streaming SSR
- you'd rather use another templating language than Astro
- you don't like file-based routing

### Fresh

Frugal is also close to Fresh, with some key differences :

- Fresh does only server-rendered pages
- Fresh uses Preact
- Fresh has no build step

In contrast, Frugal requires a build step. Frugality means sparing resources and doing work once ahead of time spare resources compared to doing things just in time in potentially multiple contexts (not that it is better or worst, it is a tradeoff).

In summary, Frugal might be a tool for you if :

- you don't want to be locked with Preact
- you don't mind having a build step
- you want static pages

## Closing up

In summary here is the context where Frugal might be interesting :

- You don't want to be locked with a specific UI language (React, Preact, Astro ...), but sill want to use them
- You want both server rendered page and static pages
- Your markup is mostly static with some interactivity (AKA a website, in contrast to a web app).
- You don't need streaming SSR
- You don't mind having a build step

If you can answer yes to all, Frugal might be a tool for you.

I don't think of Frugal as a tool to end other tools but rather as an alternative for anyone seeking more simplicity in a sea of complexity. A tool focused on delivering less code but more value.

I hope you'll find it helpful if you decide to try it!
