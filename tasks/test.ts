import * as io from "../dep/std/io.ts";

const covProfileDir = "cov_profile";
const rawCovProfileFile = "raw_cov_profile.lcov";
const covProfileFile = "cov_profile.lcov";

async function test(path: string) {
    const command = new Deno.Command(Deno.execPath(), {
        args: [
            "test",
            "-A",
            "--no-check",
            `--coverage=${covProfileDir}`,
            "--trace-ops",
            path,
        ],
    });
    const process = command.spawn();

    const status = await process.status;
    if (!status.success) {
        Deno.exit(status.code);
    }
}

const ENCODER = new TextEncoder();

async function lcovReport() {
    const command = new Deno.Command(Deno.execPath(), {
        args: [
            "coverage",
            covProfileDir,
            "--lcov",
            `--output=${rawCovProfileFile}`,
        ],
    });
    const process = command.spawn();

    const status = await process.status;
    if (!status.success) {
        Deno.exit(status.code);
    }

    const lcov = await Deno.open(rawCovProfileFile);
    const filteredLcov = await Deno.open(covProfileFile, { create: true, write: true });
    let filter = false;
    for await (const line of io.readLines(lcov)) {
        if (line.match(/SF\:.*?\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/.*/)) {
            filter = true;
        }

        if (!filter) {
            let writeLine = line;
            if (line.startsWith("SF:")) {
                writeLine = writeLine.replace(/SF:.*\/frugal\/(.*)/, "SF:$1");
            }
            filteredLcov.write(ENCODER.encode(`${writeLine}\n`));
        }

        if (line.match(/end_of_record/)) {
            filter = false;
        }
    }
}

await test("test/unit/page/JSONValue.test.ts");
await test("test/unit/page/Page.test.ts");

await test("test/integration/server/mod.test.ts");
await test("test/integration/incremental/mod.test.ts");
await test("test/integration/pages/mod.test.ts");
await test("test/integration/watch/mod.test.ts");

await lcovReport();

await Deno.remove(covProfileDir, { recursive: true });
await Deno.remove(rawCovProfileFile);
await Deno.remove("test/integration/server/dist", { recursive: true });
await Deno.remove("test/integration/incremental/dist", { recursive: true });
await Deno.remove("test/integration/pages/dist", { recursive: true });
