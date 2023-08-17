# Browser Session

A **Multi Page Application (MPA)** is a "classical" website consisting of multiple HTML pages sent by the server. To navigate from one page to another, the client requests the URL of the destination to the server that responds with the appropriate HTML document. Django, Ruby on Rails, WordPress, Eleventy, or Fresh are examples of MPA frameworks.

A **Single Page Appplication (SPA)** is a website consisting of a single HTML page that loads a javascript app. To navigate from one "view" to another, the javascript queries the necessary data and then computes and renders the DOM of the destination. Next.js, Remix, and SvelteKit are examples of SPA frameworks.

Both have their strenghts and weaknesses :

- MPAs are by default more accessible than SPA (screen reader and assistive technology easily interpret static markup, which also works well on low-capability devices). A SPA can be as accessible as an MPA, but it needs more work.
- MPAs are less complex than SPA by default.
- SPAs handle complex stateful websites better (for a web app like Gmail).
- MPAs are faster on first load (because SPA needs to load the whole application), but on subsequent navigation, the SPA is faster (the application is already loaded while the MPA needs to load the next page).

Frugal is an MPA framework, but it comes with a tool to mitigate its weaknesses : _Browser Session_

## Features

### SPA-like navigation

_Browser Session_ will "hijack" any navigation that happens (after clicking a link, clicking the back button, submitting a form, ...), load the target document with javascript, and replace the content of the current document with the loaded document. It is not faster than "real" navigation but has a nice side-effect. The javascript context is maintained since we updated the current document instead of loading a new one.

All variables in memory before navigation will still exist after navigation, like in a SPA. This can help create complex stateful experiences without heavy javascript.

> [!warn] Interaction with Islands
> To mimic full reload during "hijacked" navigations, all Islands are unmounted (and remounted if they are present on the target document). This means that internal states (like `useState`) will be lost.
>
> However, external state like a global variable or a [signal](https://preactjs.com/guide/v10/signals/) will be preserved.

### Navigation preload

_Browser Session_ will intercept navigation intent (like a link hover, focus, etc...) and prefetch the target of the navigation. The browser gets a headstart on loading the target document, and it speeds up future navigation.

## Usage

To use _Browser Session_, you just have to initialize it in a _script_ :

```ts filename=session.script.ts
import { BrowserSession } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/session.ts";

if (import.meta.main) {
    BrowserSession.init();
}
```

### `BrowserSession.init`

Initialize a _Browser Session_ with a configuration `SessionConfig`.

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
        viewTransition?: boolean
    }
}
```

This method must be called only once (calling it more will throw an error). After this call, all navigation will be "hijacked", and navigation intent will be intercepted depending on your configuration.

On certain conditions, the _Browser Session_ might do a _real_ navigation (losing the state):

- the anchor has an attribute `rel="extrenal"` or points to a different website
- the anchor disabled navigation with the attribute `data-frugal-prefetch`
- the form has an attribute `method="dialog"`
- the target url disabled navigation with a `<meta>` tag.
- the target url returned a non Ok HTTP Code

##### `prefetch.defaultPrefetch`

Configure the _Browser Session_ to prefetch by default all links except those with attribute `data-frugal-prefetch="false"` (prefetch all, except some) or to not prefetch any links except those with attribute `data-frugal-prefetch="true"` (refetch none, except some). Default to `true` (prefetch all, except some).

##### `prefetch.timeout`

If the user hovers over a link for less than 50ms, it might not be an intent to navigate. It might just be the mouse traveling on the screen. Each navigation intent has an enter event (`mouseover`, `focusin`, ...) and an exit event (`mouseout`, `focusout`, ...). An event will be considered as a navigation intent if there is no exit event after the given timeout in milliseconds after an enter event. Default to `80`.

##### `navigate.defaultNavigate`

Configure the _Browser Session_ to hijack navigation by default on all links and forms except those with attribute `data-frugal-navigate="false"` (navigate all, full reload some) or to not hijack navigation on any links and forms except those with attribute `data-frugal-navigate="true"` (full reload all, navigate some). Default to `true` (allow all, exclude some).

##### `navigate.timeout`

_Browser Session_ sets a class `frugal-navigate-loading` on the body after the given timeout in milliseconds. The class is removed when the navigation is done. You can use the presence of this class to display a loading indicator when the navigation takes too long. Default to `150`

##### `navigate.restoreScroll`

When using the back button on the browser, _Browser Session_ will restore the previous page (mimicking the browser behavior). With this parameter, you can instruct _Browser Session_ to restore the scroll to the location when the user left the page. Default to `true`

##### `navigate.resetScroll`

With this parameter, you can instruct _Browser Session_ to reset the scroll on navigation if the scroll is not already modified for other reasons (scrolling to an anchor or scroll restoration). Default to `true`

##### `navigate.viewTransition`

Enable Frugal to use [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) on navigation.

### `BrowserSession.navigate`

_Browser Session_ only intercepts UI navigation. For imperative navigation triggered via javascript, you'll have to call `BrowserSession.navigate` with the target URL.

```ts
import { BrowserSession } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/session.ts";

const result = await BrowserSession.navigate("/target/url");
```

The function is async and returns a sucess flag with a reason in case of failure :

```ts
export enum Reason {
    NON_OK_RESPONSE,
    NAVIGATION_DISABLED_ON_TARGET,
    NAVIGATION_DISABLED_ON_ELEMENT,
    EXTERNAL_TARGET,
    DIALOG_FORM,
}

export type NavigationResult = { success: false; reason: Reason } | { success: true };
```

In case of failure you will have to decide whether to abort or do a _real_ navigation by setting `location.href`.

### `BrowserSession.submit`

_Browser Session_ only intercepts UI form submission. For imperative form submission triggered via javascript, you'll have to call `BrowserSession.submit` with the submitted `<form>` element.

```ts
import { BrowserSession } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/session.ts";

const form = document.getElementById(MY_FORM_ID);

BrowserSession.submit(form);
```

The function is async and returns a sucess flag with a reason in case of failure :

```ts
export enum Reason {
    NON_OK_RESPONSE,
    NAVIGATION_DISABLED_ON_TARGET,
    NAVIGATION_DISABLED_ON_ELEMENT,
    EXTERNAL_TARGET,
    DIALOG_FORM,
}

export type NavigationResult = { success: false; reason: Reason } | { success: true };
```

In case of failure you will have to decide whether to abort or do a _real_ form submission with `form.submit()`.

### Disabling navigation for a page

With `data-frugal-navigate="false"` you can force a full reload on specific links, but what if you want a specific page to always trigger a full reload without tracking down and editing all links to this page?

To force a full reload on a specific page no matter from where it was linked, you can add a `<meta name="frugal-navigate" content="false">` to the head of the page. _Browser Session_ will abort the current navigation and trigger a full reload.

## Events

_Browser Sessions_ dispatches different events on the `window` depending on the situation

### `frugal:beforenavigate`

This event will be dispatched before a UI navigation. This event will not be dispatched after a call to `BrowserSession.navigate`.

This event is cancelable, allowing you to cancel a visit before it happens with `event.preventDefault()`.

### `frugal:readystatechange`

This event contains the current `readystate` in `event.detail.readystate`. This event will be dispatched three times during navigation :

- At the beginning of a navigation that was not canceled with `readystate: loading`.
- After having fetched and rendered the target document with `readystate: interactive`
- Once the navigation is done (including scroll manipulation) with `readystate: complete`

This event is not cancelable.

### `frugal:beforeunload`

This event will be dispatched just before rendering the new document (so right before the current document is replaced).

This event is not cancelable.
