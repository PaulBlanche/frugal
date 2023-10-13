import "../watch/livereload/_type/global.d.ts";

declare global {
    export interface ImportMeta {
        environment: "server" | "client";
    }
}
