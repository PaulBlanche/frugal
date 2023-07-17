build : 

esbuild pass on each pages (registered in config by relative path) + config
esbuild outputs es6 compatible bundles for each pages + config
    each bundle exports what the page module should export
    non js/ts imports are transformed into js/ts imports of string or whatever
iterating in metafile on each bundle output that is an entrypoint and not the config (so for each page) we can build a mapping for each page module path its output bundle and its moduleHash
we also get the config moduleHash
=> routes.json {
    config: moduleHash
    pages: { modulePath, outputBundle, moduleHash }[]
}

we load the file routes.json
we build a Router => contains all PageDescriptor (build by dynamic import of page bundle ) + method getMatchingRoute that will match a path to each page pattern until one matches
load build cache from previous buildcache.json (empty if file not found)
for each router route
    call getPaths() to get a list of generated paths
    for each path
        call STATIC(path), get a FrugalResponse
        compute the frugalresponse hash : moduleHash + hash(response.data) + path
        add the response to the build cache
            if hash already exists, keep previous serializedResponse
            if not, compute serializedResponse
                => path + body + headers + status
            { [response.hash]: serializedResponse }
write de build cache to file
=> buildcache.json : {
    [hash]: serializedResponse 
}

export: 
    for each entry in buildcache.json
    write html file with body content at path
        output warning if headers or status !== 200

serve:
    load buildcache.json in runtime cache { hash: Response }
    load Router from routes.json
    on request
        find matching route in router

production mode
build local + export local = static
build local + serve elswhere = dynamic

dev mode
watch export
watch serve

