import { parse } from "../dep/std/flags.ts";
import * as io from "../dep/std/io.ts";

const covProfileDir = "cov_profile";
const rawCovProfileFile = "raw_cov_profile.lcov";
const covProfileFile = "cov_profile.lcov";

const ENCODER = new TextEncoder();

type Test = {
    file: string;
    cleanup?: () => Promise<void>;
};

const TESTS: Test[] = [
    { file: "test/unit/page/JSONValue.test.ts" },
    { file: "test/unit/page/Page.test.ts" },
    {
        file: "test/integration/server/mod.test.ts",
        cleanup: async () => {
            await Deno.remove("test/integration/server/dist", { recursive: true });
        },
    },
    {
        file: "test/integration/incremental/mod.test.ts",
        cleanup: async () => {
            await Deno.remove("test/integration/incremental/dist", { recursive: true });
        },
    },
    {
        file: "test/integration/pages/mod.test.ts",
        cleanup: async () => {
            await Deno.remove("test/integration/pages/dist", { recursive: true });
        },
    },
    {
        file: "test/integration/watch/mod.test.ts",
        cleanup: async () => {
            await Deno.remove("test/integration/watch/dist", { recursive: true });
        },
    },
    {
        file: "test/integration/plugin/css/mod.test.ts",
        cleanup: async () => {
            await Deno.remove("test/integration/plugin/css/dist", { recursive: true });
        },
    },
    {
        file: "test/integration/plugin/cssModule/mod.test.ts",
        cleanup: async () => {
            await Deno.remove("test/integration/plugin/cssModule/dist", { recursive: true });
        },
    },
];

const args = parse(Deno.args, {
    boolean: ["update"],
    default: {
        update: false,
    },
});

const tests = args._.length === 0 ? TESTS : Array.from(Deno.args.reduce((tests, matcher) => {
    const test = TESTS.find((test) => test.file.includes(matcher));
    if (test) {
        tests.add(test);
    }
    return tests;
}, new Set<Test>()));

for (const test of tests) {
    await runTest(test.file, args.update);
}

await lcovReport();

await Deno.remove(covProfileDir, { recursive: true });
await Deno.remove(rawCovProfileFile);

for (const test of tests) {
    await test.cleanup?.();
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
