import { parse } from "../dep/std/flags.ts";
import * as io from "../dep/std/io.ts";

const covProfileDir = "cov_profile";
const rawCovProfileFile = "raw_cov_profile.lcov";
const covProfileFile = "cov_profile.lcov";

const ENCODER = new TextEncoder();

const TESTS = [
    "test/unit/page/JSONValue.test.ts",
    "test/unit/page/Page.test.ts",
    "test/unit/log.test.ts",
    "test/integration/server/mod.test.ts",
    "test/integration/incremental/mod.test.ts",
    "test/integration/pages/mod.test.ts",
    "test/integration/watch/mod.test.ts",
    "test/integration/plugin/css/mod.test.ts",
    "test/integration/plugin/cssModule/mod.test.ts",
];

const args = parse(Deno.args, {
    boolean: ["update"],
    default: {
        update: false,
    },
});

const tests = args._.length === 0 ? TESTS : Array.from(Deno.args.reduce((tests, matcher) => {
    const test = TESTS.find((test) => test.includes(matcher));
    if (test) {
        tests.add(test);
    }
    return tests;
}, new Set<string>()));

try {
    for (const test of tests) {
        await runTest(test, args.update);
    }

    await lcovReport();
} finally {
    await tryRemove(covProfileDir, { recursive: true });
    await tryRemove(rawCovProfileFile);
}

async function runTest(path: string, update: boolean) {
    const command = new Deno.Command(Deno.execPath(), {
        args: [
            "test",
            "--unstable",
            "-A",
            "--no-check",
            `--coverage=${covProfileDir}`,
            path,
            ...(update ? ["--", "--update"] : []),
        ],
    });
    const process = command.spawn();

    const status = await process.status;
    if (!status.success) {
        Deno.exit(status.code);
    }
}

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
    const filteredLcov = await Deno.open(covProfileFile, { create: true, truncate: true, write: true });
    let filter = false;
    for await (const _line of io.readLines(lcov)) {
        let line = _line;
        if (_line.startsWith("SF:")) {
            line = line.replace(/SF:.*\/frugal\/(.*)/, "SF:$1");
        }

        if (line.match(/SF\:test\/.*\/dist\/.*/)) {
            filter = true;
        }

        if (!filter) {
            filteredLcov.write(ENCODER.encode(`${line}\n`));
        }

        if (line.match(/end_of_record/)) {
            filter = false;
        }
    }
}

async function tryRemove(path: string | URL, options?: Deno.RemoveOptions | undefined) {
    try {
        await Deno.remove(path, options);
    } catch {
        // swallow error, yum yum
    }
}
