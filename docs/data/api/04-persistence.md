# Persistence

By default, data that Frugal generates is written on the filesystem. For a static site generator, this is the best option.

But some environment don't have access to a file system (like Deno Deploy). For those environments, Frugal accepts some configuration telling it how to persist different types of data.

## Data Frugal needs to persist

Frugal needs to persist pages and cache information.

Pages are straightforward, it is the generated html markup for each page. Frugal will need to write pages during build time, and if you use the server, Frugal will also need to read and write pages during runtime (for static page refresh).

Cache is a bit more complex, but essentially, this is information on the build process of each static assets (assets created from loader, or html pages). This information is leveraged by Frugal to decide whether we need to actually rebuild a page when a build is scheduled. Frugal will need to read and write cache information during build time and if you use the server, Frugal will also need to read and write pages during runtime (for static page refresh).

## Kinds of persistence

For now, there is only two kind of persistence:

- File system persistence (plain write to the file system).
- [Upstash](https://upstash.com/) persistence.

The Upstash persistence is a _ad-hoc_ solution for my situation (having to persist information in Deno Deploy) but it should be simple to write persistence adapter to any storage provider.

## Setup a persistence provider

You have to create a persistence provider instance, and pass it in the Frugal configuration:

```ts
import * as frugal from './dep/frugal/core.ts';

const upstashPersistence = new frugal.UpstashPersistence(
    UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN,
);

const config: frugal.Config = {
    //...
    pagePersistence: upstashPersistence,
    cachePersistence: upstashPersistence,
};
```
