import { run } from "node:test";
import { spec } from "node:test/reporters";
import * as fs from "node:fs/promises";
import * as url from "node:url";
import * as path from "node:path";
import * as process from "node:process";
import * as child_process from "node:child_process";

if (process.env["CHILD_PROCESS"] === undefined) {
    spawnTestProcess();
} else {
    testProcessBody();
}

function spawnTestProcess() {
    /** @type {Record<string, string>} */
    const env = { ...process.env, CHILD_PROCESS: "1" };
    const flags = [];
    const argv = process.argv.slice(2);

    if (argv.includes("--update")) {
        env["UPDATE_SNAPSHOT"] = "1";
    }

    if (argv.includes("--coverage")) {
        env["NODE_V8_COVERAGE"] = "coverage";
        flags.push("--experimental-test-coverage");
    }

    child_process.spawn(process.argv[0], [...flags, process.argv[1]], {
        env,
        stdio: "inherit",
    });
}

async function testProcessBody() {
    const testFiles = [];
    const dir = await fs.opendir(url.fileURLToPath(import.meta.resolve("../test")), {
        recursive: true,
    });

    for await (const entry of dir) {
        if (entry.name.match(/\.test\.[tj]sx?$/)) {
            testFiles.push(path.resolve(entry.path, entry.name));
        }
    }

    run({
        files: testFiles,
        concurrency: true,
    })
        .compose(new spec())
        .pipe(process.stdout);
}
