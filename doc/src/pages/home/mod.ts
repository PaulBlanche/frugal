import { DataResponse } from "$dep/frugal/mod.ts";
import { getRenderFrom } from "$dep/frugal/runtime/preact.server.ts";

import { Page } from "./Page.tsx";

export const route = "/";

export function generate() {
    return new DataResponse({}, {
        headers: {
            "Cache-Control": "public, max-age=300, must-revalidate", // cached for 5min
        },
    });
}

export const render = getRenderFrom(Page);
