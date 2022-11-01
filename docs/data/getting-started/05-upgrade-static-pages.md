# Upgrade static pages

Now that we have a server, we can unlock some capabilities of static pages.

## Static page generation at runtime

In the `getPathList` you are not required to return the exact full list of every path of your page. You might return a subset of the most visited one, or even return nothing and not define the function altogether.

If the server recieve a request matching the `pattern` of a static page that was not generated, frugal will generate the page and store it in cache. Every subsequent request will be served from the cache.

## Page persistance

On a standard server, the cache is simply the filesytem (each page generated at runtime are stored in the same place as the page generated at build time). On serverless context, there is not runtime filesystem to write pages in. To fix that, frugal abstract read and write with a [persistance layer](/docs/concepts/persistance-layer). By default frugal uses a filesystem persistance layer, but you can configure frugal to use a different one :

```ts
export const config: frugal.Config = {
    //...
    pagePersistance: myPersistanceLayer,
};
```

For now, in addition to the filesystem persistance, there is only an [Upstash](https://upstash.com/) persistance layer that will store pages in redis.

## On-demand static page refresh

If you know the data for some static pages hax changed and you want the static pages to update without having to build and deploy your website, you can use on-demand static page refresh. To activate it, you need to add some configuration :

```ts
export const config: frugal.Config = {
    //...
    server: {
        //...
        refreshKey: 'my-secret-key',
    },
};
```

Now you cant send a `GET` request on the path of a static page you wish to refresh with the query parameter `?force_refresh`. Add an `Authorization` with the key you defined in the config, and frugal will generate the page and replace it in cache (using page persistance layer). Every subsequent request will get the new version from the cache.
