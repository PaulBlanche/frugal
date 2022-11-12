# Client Session

## Session features

The session will hijack every navigation (link click, focused link + Enter, back button). Each time you navigate, the session will prevent the default browser action (fetching and displaying the new page) and simulate it in the same JavaScript context. The session will fetch the target page, replace the current DOM with the DOM of the target page and update the history. You get the new page, same as with a natural navigation, but you also get to keep the JavaScript context, because we never really left the page.

The session will also prefetch target pages when you hover a link (or on touchstart on mobile). Each time you hover a link, it will insert a `<link rel="prefetch">` in the head of the document.

[warn]> When you do `new Session()` this creates a singleton. Any call after that will return the singleton. This means that you only have the opportunity to set configuration options on the first `new Session()`. Rather than `new Session()` you can use `Session.getInstance()` to get the instance you configured earlier.

## Excluding some link

If you want to exclude a link from the session, simply add the attribute `data-frugal-navigate="false"`. Any other value than `"false"` will not exclude the link from the session. If you want to prevent prefetching a link, simply add the attribute `data-frugal-prefetch="false"`. Again, any other value than `"false"` will not prevent prefetching.

If you want to exclude a page from the session (without having to exclude each link to this page), you can add a meta tag in the head of the page `<meta name="frugal-navigate" content="false">`. Any other value than `"false"` will not exclude the page from the session.

## Excluding all links except some

You can globally disable prefetching and session for all links by configuring the `Session` instance :

```ts
const session = new Session({
    prefetch: {
        defaultPrefetch: false,
    },
    navigate: {
        defaultNavigate: false,
    },
});
```

In this situation, if you want to include a link in the session, simply add the attribute
`data-frugal-navigate="true"`. Any other value than `"true"` will keep the link excluded from the session. If you want to activate preloading of a link, simply add the attribute `data-frugal-preload="true"`. Again, any other value than `"true"` will not keep preloading disabled.

## Loading state

By default, if simulating the navigation to a link takes longer than 150ms, the class `frugal-navigate-loading` will be applied to the `<body>` of the document. This timeout is configurable :

```ts
const session = new Session({
    navigate: {
        timeout: 300,
    },
});
```

## Prefetch delays

By default, `frugal_session` will prefetch a link 80ms after the start of the hover. After prefetching, `frugal_session` will not prefetch the same link for 1000ms. Those timeouts are configurable :

```ts
const session = new Session({
    prefetch: {
        timeout: 80,
        cooldown: 1000,
    },
});
```

## Scroll reset and restoration

By default, `frugal_session` reset scroll on each navigation (when you navigate to a new page, you get to the top of the page), and restore scroll on each history navigation (when you hit the back or forward button, you get to the part of the page you where when you left). This behavior is configurable :

```ts
const session = new Session({
    navigate: {
        restoreScroll: false,
        resetScroll: false,
    },
});
```

## Programmatic navigation

If you want to trigger a navigation in JS without losing the session, instead of doing `location.pathname = "/my/new/path"`, you can use the `navigate` function exposed on the `Session` object :

```ts
import { Session } from 'https://deno.land/x/frugal/client_session.ts';

function main() {
    //...

    myButtonElement.addEventListener('click', () => {
        Session.getInstance().navigate('/my/new/path');
    });
}
```

You are also free to use the `history` api as you like, since the session listen and react to `popstate` events.
