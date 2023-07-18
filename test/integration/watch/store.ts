//comment
//comment
//comment
//comment
export const store = async () =>
    JSON.parse(
        await Deno.readTextFile(new URL("../../../data.json", import.meta.url)),
    );
