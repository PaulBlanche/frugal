refacto page
descriptor can have getPaths to 'prebuild' and strictPaths ( = might be static)
handler GET etc... return a new DataResponse({ type:'static'|'dynamic, ... })

    build => build all paths returned from getPaths (skip if dataresponse is dynamic)

    server:
        server match route
        if page has getPaths
            search cache
                succes
                    serve from cache (prebuild static page)
        if page has getPaths && !stricPaths || page !has getPaths
            generate page
                if response static
                    cache response
                serve response


        /page/static-prebuilt
            server match route
            search cache
            serve from cache

        /page/static-not-prebuild
            server match route
            search cache fail
            if page has getPaths && allowJIT
            generate page => response static
            cache response
            serve

        /page/dynamic
            server match route
            search cache fail
            generate page => response dynamic
            serve
