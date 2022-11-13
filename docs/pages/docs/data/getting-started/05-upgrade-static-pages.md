# Upgrade static pages

Now that we have a server, we can unlock some capabilities of static pages.

## Static page generation at runtime

In the `getPathList` you are not required to return the exact full list of every path of your page. You might return a subset of the most visited one, or even return nothing and not define the function altogether.

If the server receive a request matching the `pattern` of a static page that was not generated, Frugal will generate the page and store it in cache. Every subsequent request will be served from the cache.

## Page persistence

On a standard server, the cache is simply the filesystem (each page generated at runtime are stored in the same place as the page generated at build time). On serverless context, there is not runtime filesystem to write pages in. To fix that, Frugal abstract read and write with a [persistence layer](/docs/api/04-persistence). By default Frugal uses a filesystem persistence layer, but you can configure Frugal to use a different one:

```ts
export const config: frugal.Config = {
    //...
    pagePersistence: myPersistenceLayer,
};
```

For now, in addition to the filesystem persistence, there is only an [Upstash](https://upstash.com/) persistence layer that will store pages in redis.

## On-demand static page refresh

If you know the data for some static pages has changed and you want the static pages to update without having to build and deploy your website, you can use on-demand static page refresh. To activate it, you need to add some configuration:

```ts
export const config: frugal.Config = {
    //...
    server: {
        //...
        refreshKey: 'my-secret-key',
    },
};
```

Now you cant send a `GET` request on the path of a static page you wish to refresh with the query parameter `?force_refresh=my-secret-key`. Frugal will generate the page and replace it in cache (using page persistence layer). Every subsequent request will get the new version from the cache.