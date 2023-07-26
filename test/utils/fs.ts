import * as fs from "../../dep/std/fs.ts";

export async function setupFiles(base: URL, files: Record<string, string>) {
    for (const [path, content] of Object.entries(files)) {
        const url = new URL(path, base);
        await fs.ensureFile(url);
        await Deno.writeTextFile(url, content);
    }
}
