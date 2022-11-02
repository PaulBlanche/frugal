# Client session

For now we only have a Multi Page Application (MPA). Each time we navigate between pages, a full reload is done in the client. A new DOM is built with the new HTML and the javascript context of the previous page is lost. You can't keep any data in javascript memory between the previous and the next page.

This can be problematic if some client-side js relies on a state. If the client navigates away and back, the state is lost and re-initialized.

[Client session](/docs/api/06-client-session) fixes that, by making a MPA work like a Single Page Application (SPA).

## Using a session

In a script module (`session.script.ts` for example) add the following code :

```ts
import { Session } from 'https://deno.land/x/frugal/client_session.ts';

export function main() {
    const session = new Session();
    session.start();
}
```

And import this module in your page descriptor (with the [script loader](/docs/api/02-script-loader) configured).

Once the `start` method is called, the session will hijack every navigation on the page (link click, popstate) and prevent the default behavior of the browser.

Instead, the session will fetch the target page in the background, and replace the current DOM with the DOM of the new page. That way the javascript context is preserved while at the same time getting the new page.
