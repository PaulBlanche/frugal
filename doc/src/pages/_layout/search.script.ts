import { SearchIndex } from "$dep/frugal/doc/src/search.ts";

if (import.meta.main) {
    (async function run() {
        const data = await fetch("/search-index.json");
        const searchIndex = SearchIndex.from(await data.json());

        // TODO
    })();
}
