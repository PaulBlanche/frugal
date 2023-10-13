import * as file_serve from "./dependencies/_dep/std/http/file_server.js";

Deno.serve(async (request) => {
    const response = await file_serve.serveDir(request, {
        fsRoot: "/home/whiteshoulders/perso/frugal/packages/frugal",
    });

    response.headers.set("content-type", "application/typescript");

    return response;
});
