import { SearchIndex } from "$dep/frugal/doc/src/search.ts";

if (import.meta.environment === "client") {
    (async function run() {
        const data = await fetch("/search-index.json");
        // deno-lint-ignore no-unused-vars
        const searchIndex = SearchIndex.from(await data.json());

        // TODO
    })();
}
