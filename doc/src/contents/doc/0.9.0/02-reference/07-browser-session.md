# Browser Session

A **Multi Page Application (MPA)** is a "classical" website consisting of multiple HTML page sent by the server. To navigate from one page to another, the client request the url of the destination to the server that respond with the appropriate HTML document. Django, Ruby on Rails, Wordpress, Eleventy or Fresh are exemples of MPA frameworks.

A **Single Page Appplication (SPA)** is a website consisting of a single HTML page that loads a javascript app. To navigate from on "view" to another, the javascript query the necessary data then computes and render the DOM of the destination. Next.js, Remix, SvelteKit are exemples of SPA framework.

Both have their strenghts and weaknesses :

- MPA are by default more accessible than SPA (static markup that is easily interpreted by screen reader and assistive technology, and work on low capability devices). A SPA can be as accessible than a MPA, but it needs more work.
- MPA are by default less complex than SPA.
- SPA handle complex stateful website better (for a web app like Gmail).
- MPA are faster on first load (because SPA needs to load the whole application), but on subsequent navigation the SPA is faster (the application is already loaded while the MPA needs to load the next page).

Frugal is a MPA framework, but it comes with a tool to mitigates its weaknesses : _Browser Session_

## Features

### SPA-like navigation

_Browser Session_ will "hijack" any navigation that happen (after clicking a link, click the back button, submitting a form, ...), load the target document with javascript and replace the content of the current document with the loaded document. It is not faster than "real" navigation, but it comes with a nice benefit : since we updated the current document instead of loading a new document, the javascript context is maintained.

All variables in memory before navigation will still exist after navigation, like in a SPA. This can help create complex stateful experience without heavy javascript.

### Navigation preload

_Browser Session_ will intercept navigation intent (like a link hover, focus, etc...) and prefetch the target of the navigation. The browser get a headstart on loading the target document, and it speeds up future navigation.

## Usage

To use _Browser Session_, you just have to initialize it in a _script_ :

```ts filename=session.script.ts
import { BrowserSession } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/session.ts";

if (import.meta.main) {
    BrowserSession.init();
}
```

### `BrowserSession.init`

Initialize a _Browser Session_ with a given configuration `SessionConfig`.

```ts
type SessionConfig {
    prefetch?: {
        defaultPrefetch?: boolean;
        timeout?: number;
    };
    navigate?: {
        defaultNavigate?: boolean;
        timeout?: number;
        resetScroll?: boolean;
        restoreScroll?: boolean;
    }
}
```

This method must be called only once (calling it more will throw an error). After this call all navigation will be "hijacked" and navigation intent will be intercepted depending on your configuration.

##### `prefetch.defaultPrefetch`

Configure the _Browser Session_ to preftech by default all links except those with attribute `data-frugal-prefetch="false"` (prefetch all, except some) or to not prefetch any links except those with attribute `data-frugal-prefetch="true"` (refetch none, except some). Default to `true` (prefetch all, except some).

##### `prefetch.timeout`

If the user hover a link for less than 50ms it might not be an intent to navigate, it might juste be the mouse traveling on the screen. Each navigation intent have an enter event (`mouseover`, `focusin`, ...) and an exit event (`mouseout`, `focusout`, ...). An event will be considered as a navigation intent if after an enter event there where no exit event after the given timeout in millisecond. Default to `80`.

##### `navigate.defaultNavigate`

Configure the _Browser Session_ to hijack navigation by default on all links and forms except those with attribute `data-frugal-navigate="false"` (navigate all, full reload some) or to not hijack navigation on any links and forms except those with attribute `data-frugal-navigate="true"` (full reload all, navigate some). Default to `true` (allow all, exclude some).

##### `navigate.timeout`

_Browser Session_ sets a class `frugal-navigate-loading` on the body after the given timeout in millisecond. The class is removed when the navigation is done. You can use the presence of this class to display a loading indicator when the navigation takes too long. Default to `150`

##### `navigate.restoreScroll`

When using the back button on the browser, _Browser Session_ will restore the previous page (mimicking the browser behaviour). With this parameter you can instruct _Browser Session_ to restore the scroll to the location it was when the user left the page. Default to `true`

##### `navigate.resetScroll`

With this parameter you can instruct _Browser Session_ to reset the scroll on navigation, if the scroll is not already modified for other reasons (scrolling to an anchor or scroll restoration). Default to `true`

### `BrowserSession.navigate`

_Browser Session_ only intercept UI navigation. For imperative navigation triggered via javascript you'll have to call `BrowserSession.navigate` with the target url.

### `BrowserSession.submit`

_Browser Session_ only intercept UI form submission. For imperative form submission triggered via javascript you'll have to call `BrowserSession.submit` with the submitted `<form>` element.

### Disabling navigation for a page

With `data-frugal-navigate="false"` you can force a full reload on specific link, but if you want a specific page to always trigger a full reload, you'll have to track down and edit all links to this page.

To force a full reload on a specific page no matter from where it was linked, you can add a `<meta name="frugal-navigate" content="false">` to the head of the page. _Browser Session_ will abort the current navigation and trigger a full reload.

## Events

_Browser Sessions_ dispatches different events on the `window` depending on the situation

### `frugal:beforenavigate`

This event will be dispatched before a UI navigation. This event will not be dispatched after a call to `BrowserSession.navigate`.

This event is cancelable, allowing you to cancel a visit before it happen with `event.preventDefault()`.

### `frugal:readystatechange`

This event contains the current `readystate` in `event.detail.readystate`. This event will be dispatched three time during a navigation :

- At the begining of a navigation that was not canceled with `readystate: loading`.
- After having fetched and rendered the target document with `readystate: interactive`
- Once the navigation is done (including scroll manipulation) with `readystate: complete`

This event is not cancelable

### `frugal:beforeunload`

This event will be dispatched just before rendering the new document (so right before the current document is replaced).

This event is not cancelable
