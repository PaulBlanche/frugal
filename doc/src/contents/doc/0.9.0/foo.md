# foo

First you need to write some configuration module for frugal. In a module (the convention is `/frugal.config.ts`, but you can use any other path) export a simple config object:

```ts lines=[3-5,7] filename=foo/bar.ts
import type * as frugal from 'https://deno.land/x/frugal/core.ts';

const self = new URL(import.meta.url);

export const config: frugal.Config = {
  self,
  outputDir: './dist',
};
```

The `self` value will be used to define the `root` of your project. Since it is conventional to have the configuration at the root of the project, `self` should be the absolute url of the module. Every relative path in the config will be resolved relatively to the root of your project.

The `outputDir` value is the path where Frugal will generate your site. Inside this directory Frugal will create a `public` directory that can be served by a server like `nginx` or `Apache HTTP Server`.

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

## toto

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

coucou

## tata

caca

caca

caca

caca

caca

caca

caca

caca

caca

caca

caca

caca

caca

caca

caca

caca

caca
