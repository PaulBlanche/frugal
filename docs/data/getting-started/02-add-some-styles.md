# Add some styles

For now, frugal produces only plain html. If we want to add some styles, there is two options.

We can just copy some `.css` file in the `/public` directory and add a `<link>` to it in the `<head>` of our pages. This would work, but you lose some advantages of frugal.

Remmber that frugal uses incremental generation ? Frugal does this by watching the dependencies of your pages (modules imported by your page). If you simply `<link>` some external `.css` file, frugal will not watch them, because they are not dependencies. This means that if you change something in your `.css` file, furgal will not see the change, and the next build will do nothing.

In order to leverage incremental generation for styles, you have to use a loader.

## Style loader

In `frugal.config.ts`, add the [style loader](/docs/api/03-style-loader) :

```ts
//...
import { StyleLoader } from 'https://deno.land/x/frugal/loader_style.ts';

export const config: frugal.Config = {
    //...
    loader: [
        new StyleLoader({
            test: (url) => /\.style\.ts$/.test(url.toString()),
        }),
    ],
};
```

The style loader taks a `test` function that will be used to detect style modules given their url. Here we say that evry module ending in `.style.ts` will be a style module

## Style module

Then, we can write a style module (in `/pages/post/post.style.ts` for exemple) :

```ts
import { className } from 'https://deno.land/x/frugal/styled.ts';

const titleMargin = 10;

export const title = className('title').styled`
    margin: ${titleMargin}px;
`;
```

The `className` function generates a unique classname. The parameter passed to the `className` function will be used as a prefix to help debug styles.

You can now use the style module in your modules (in `/pages/post/post.ts` for exemple) :

```ts
import * as s from './post.style.ts';
import { cx } from 'https://deno.land/x/frugal/styled.ts';

export function post(post: Post) {
    return `<div>
        <h1 class="${cx(s.title)}">${post.title}</h1>
        ${post.content}
    </div>`;
}
```

Since now our style module is imported, frugal can see any modification done to the styles and do incremental generation correctly. If you change something in a style module, frugal will rebuild any page that uses it.

At build time, frugal will collect every style module and put evry style in one stylesheet for the whole website.

## Include the generated stylesheet

The `getContent` function will recive a `loaderContext` object that contains data that the loaders have generated. For the style loader you can use it like this :

```ts
async function getContent(params: frugal.GetContentParams<Path, Post>) {
    const styleUrl = params.loaderContext.get('style');

    return `<html>
        <head>
            ...
            <link rel="stylesheet" href="${styleUrl}" />
        </head>
        ...
    </html>`;
}
```
