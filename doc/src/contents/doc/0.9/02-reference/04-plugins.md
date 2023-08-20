# Plugins

## Scripts

By default, any javascript you write will be interpreted server-side to generate the page markup. To execute javascript in the browser, we could insert a `<script>` tag pointing to a script in the `static/` folder. But there are several drawbacks :

- If you have multiple scripts, you will have to bundle them in a separate process. This means that besides Frugal, you will have another process (like esbuild) running to bundle your scripts.
- If the script source change during development, you'll have to refresh the browser manually to get the updated bundle once the bundling from the second process is done.

It could work for a small number of scripts that do not change often, but this does not scale. To help you, Frugal comes with a `script` plugin to handle them for you.

### Basic usage

First you'll have to register the plugin :

```ts filename=frugal.config
...
import { script } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/script.ts";

export default {
    ...
    plugins: [script()]
    ...
}
```

Now each js module imported by a page matching `/.script.[tj]sx?$/` will be considered as _scripts_ and will be bundled.

#### Conditional execution with `import.meta.environment`

Since your script needs to be imported by the page to be bundled, the top level of your script will be executed server-side. All usages of browser-specific API will fail.

To fix that, Frugal add an `environment` value in `import.meta`. This value indicates if the script is executed client-side or server-side :

```ts filename=main.script.ts
// this is executed both in the server and the browser.
export const ID = 'my-id'

if (import.meta.environment === 'client') {
    // this is executed only in the browser.
    document.getElementById(ID).style.color = 'blue'
}
```

That way, you can safely use browser-specific API while sharing data with the server. Here we export the `ID` variable to be used in the markup: script and markup can be kept in sync.

```ts filename=page.ts lines=[1,8]
import { ID } from './main.script.ts'

...

export function render() {
    return `<!DOCTYPE html>
<html>
    <body>
        <h1 id="${ID}">Hello world</h1>
    </body>
</html>`
}
```

#### Loading scripts

Frugal will bundle all your script using esbuild, and output them in a `public` directory in the [`outdir`](/doc@{{version}}/reference/configuration#heading-outdir) directory. But you still have to insert a `<script>` in your markup :

```ts filename=page.ts lines=[3,6-8]
...

export function render({ assets, descriptor }: RenderContext<typeof route>) {
    return `<!DOCTYPE html>
<html>
    <head>
        <script src="${assets['script'][descriptor]}" />
    </head>
    <body>
        <h1 id="${ID}">Hello world</h1>
    </body>
</html>`
}
```

The style plugin will set the `"script"` key of the `assets` object to an map of all bundle associated to their descriptor id. To get the bundle of the page, you'll have to use `assets['script'][descriptor]`

### Configuration

The plugin accepts a configuration object :

```ts
type ScriptOptions = {
    filter: RegExp;
};
```

#### `filter`

The regexp used to determine if a module is a script. Defaults to `/.script.[tj]sx?$/`.

## Css Module

Frugal load standard CSS stylesheet out of the box thanks to esbuild. But you might want to "componentize" your styles with [CSS Modules](https://github.com/css-modules/css-modules). This plugin allows you to compile CSS Modules.

### Basic usage

First, you'll have to register the plugin.

```ts filename=frugal.config
...
import { cssModule } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/cssModule.ts";

export default {
    ...
    plugins: [cssModule()]
    ...
}
```

With the plugin registered, given the following CSS module :

```css filename=style.module.css
.foo {
    color: red;
}

.bar {
    composes: foo;
    background: blue;
}
```

Importing it in our page module will give us a default import containing an object with all the classes defined :

```ts filename=page.ts
import style from './style.module.css'

console.log(style['foo']) // contains something like "l6pGIG_foo"
console.log(style['bar']) // contains something like "l6pGIG_bar l6pGIG_foo"
console.log(style['baz']) // undefined
```

### Configuration

This plugin accepts a configuration object :

```ts
type ScriptOptions = {
    dashedIdents?: boolean;
    filter: RegExp;
    pattern?: string;
};
```

#### `dashedIdents`

Whether to rename dashed identifiers, e.g. custom properties (see [lighnigcss doc](https://lightningcss.dev/css-modules.html#local-css-variables) for more information).

#### `filter`

The regexp used to determine if a module is a CSS module. Defaults to `/\.module.css$/`.

#### `pattern`

The pattern to use when renaming class names and other identifiers (see [lighnigcss doc](https://lightningcss.dev/css-modules.html#custom-naming-patterns) for more information)

## Google Fonts optimization

This plugin will detect stylesheets from [Google Fonts](https://fonts.google.com/), download each font and transform the stylesheet to reference the downloaded local fonts.

### Basic usage

First, you'll have to register the plugin :

```ts filename=frugal.config
...
import { googleFonts } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/cssModule.ts";

export default {
    ...
    plugins: [googleFonts()]
    ...
}
```

Now any `@import` coming from Google Fonts will be modified by the plugin and inlined in your stylesheet.

### Configuration

This plugin accepts a configuration object :

```ts
type ScriptOptions = {
    type?: "local" | "external";
};
```

#### `type`

Whether to download the fonts to make them local to your server or keep the url to Google Fonts' CDN. Defaults to `"local"`.

## SVG sprites

When using SVG icons, it might be beneficial to generate sprites: a large SVG file containing all your icons as `<symbol>` (learn more [here](https://medium.com/@hayavuk/complete-guide-to-svg-sprites-7e202e215d34) about the technique). Frugal can automate the process for you.

### Basic usage

First, you'll have to register the plugin :

```ts filename=frugal.config
...
import { svg } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/svg.ts";

export default {
    ...
    plugins: [svg()]
    ...
}
```

Now you can import `.svg` files inside your modules and receive an object `{ href:string, viewBox:string }` as a default export. You can use those values to generate a "reference" to the symbol inside the sprite sheet :

```ts
import icon from "./icon.svg";

const svg = `<svg viewBox="${icon.viewBox}">
    <use href="${icon.href} />
</svg>`;
```

Frugal will consider that two SVGs are in the same sprite sheet if they are in the same directory.

### Configuration

This plugin accepts a configuration object :

```ts
type SvgOptions = {
    filter: RegExp;
};
```

#### `filter`

The regexp used to determine if a module is an SVG file. Defaults to `/\.svg$/`.

## Svelte

> [!warn]
> This plugin is experimental. No extensive tests were done to ensure it worked in all conditions, but it should work in most cases.

If you wish to use Svelte as a UI framework, you will need this plugin to import `.svelte` files.

### Basic usage

First, you'll have to register the plugin :

```ts filename=frugal.config
...
import { svelte } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/svelte.ts";

export default {
    ...
    plugins: [svelte()]
    ...
}
```

Now you can import `.svelte` files inside your modules, and you'll receive as a default export either a [Client Side Component](https://svelte.dev/docs/client-side-component-api) or a [Server Side Component](https://svelte.dev/docs/server-side-component-api) depending if the `.svelte` file was imported in a _script_ or not.

### Configuration

This plugin accepts a configuration object :

```ts
type SvelteOptions = {
    filter: RegExp;
    preprocess?: PreprocessorGroup | PreprocessorGroup[];
};
```

#### `filter`

The regexp used to determine if a module is a Svelte file. Defaults to `/\.svelte$/`.

#### `preprocess`

If you need to register [preprocessor for svelte](https://svelte.dev/docs/svelte-compiler#preprocess).

## Writing your own plugin

A Frugal plugin is an [esbuild plugin](https://esbuild.github.io/plugins/) with an extra step :

```ts
type Plugin = (context: PluginContext) => esbuild.Plugin;

interface PluginContext {
    config: FrugalConfig;
    url: (args: { namespace: string; path: string }) => URL;
    load: (specifier: URL) => Promise<Uint8Array>;
    output: (type: string, output: any) => void;
    collect: (filter: RegExp, metafile: esbuild.Metafile) => Asset[];
}

type Asset = {
    entrypoint: string;
    url: URL;
};
```

A Frugal plugin is a function that receives a context object and returns an esbuild plugin. The context object exposes a few properties.

#### `config`

Contains the current frugal config.

#### `url`

A utility function to get an URL from the `namespace` and `path` given by esbuild.

#### `load`

A method that will load the file's content at the given URL (either via `fetch` or `readFile`).

#### `output`

The function used to set values in the `assets` object passed to page descriptor: `type` will be the key and `output` the value that will be set in `assets`.

#### `collect`

Given a filter and a [metafile](https://esbuild.github.io/api/#metafile), this method will collect all matching files that esbuild output, keeping track of their entrypoints.
