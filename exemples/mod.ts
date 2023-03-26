import * as file_server from '../dep/std/http/file_server.ts';
import * as http from '../dep/std/http.ts';
import * as path from '../dep/std/path.ts';

const configUrl = new URL(Deno.args[0], import.meta.url);

const version = crypto.randomUUID();

await Deno.writeTextFile(
    new URL('import_map.json', configUrl),
    `{
    "imports": {
        "svelte/": "npm:/svelte@3.50.0/",
        "preact": "https://esm.sh/preact@10.11.3",
        "preact/signals": "https://esm.sh/@preact/signals@1.1.2",
        "preact/jsx-runtime": "https://esm.sh/preact@10.11.3/jsx-runtime",
        "preact/hooks": "https://esm.sh/preact@10.11.3/hooks",
        "preact-render-to-string": "https://esm.sh/preact-render-to-string@5.2.6?deps=preact@10.11.3",
        "frugal/": "http://localhost:8001/${version}/"
    }
}`,
);

http.serve(async (request) => {
    const url = new URL(request.url.replace(`/${version}`, ''));
    const response = await file_server.serveFile(
        request,
        path.fromFileUrl(new URL(`..${url.pathname}`, import.meta.url)),
    );

    response.headers.set('content-type', 'application/typescript');

    return response;
}, {
    port: 8001,
    onListen() {
        const command = new Deno.Command(Deno.execPath(), {
            args: [
                'run',
                '-A',
                '--unstable',
                configUrl.pathname,
            ],
        });

        command.spawn();
    },
});
