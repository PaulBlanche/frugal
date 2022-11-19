import * as fs from './dep/std/fs.ts';

await importDeps(new URL('./dep', import.meta.url));
await importDeps(new URL('./docs/dep', import.meta.url));

async function importDeps(url: URL) {
    for await (const entry of fs.walk(url)) {
        if (entry.isFile) {
            try {
                await import(entry.path);
            } catch (error) {
                console.log(error);
            }
        }
    }
}
