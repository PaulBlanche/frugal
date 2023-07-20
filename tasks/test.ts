import { parse } from "../dep/std/flags.ts";
import * as io from "../dep/std/io.ts";
import * as fs from "../dep/std/fs.ts";

const covProfileDir = "cov_profile";
const rawCovProfileFile = "raw_cov_profile.lcov";
const covProfileFile = "cov_profile.lcov";

const ENCODER = new TextEncoder();

const args = parse(Deno.args, {
    boolean: ["update", "coverage", "trace-ops"],
    default: {
        update: false,
    },
});

try {
    for await (const entry of fs.walk(new URL("../test/", import.meta.url))) {
        if (entry.name.match(/\.test\.[tj]sx?$/)) {
            const matchers = args._;
            if (matchers.length === 0 || matchers.some((matcher) => entry.path.includes(String(matcher)))) {
                await runTest(entry.path);
            }
        }
    }

    if (args.coverage) {
        await lcovReport();
    }
} finally {
    await tryRemove(covProfileDir, { recursive: true });
    await tryRemove(rawCovProfileFile);
}

async function runTest(path: string) {
    const commandArgs = ["test", "--unstable", "-A", "--no-check"];
    if (args.coverages) {
        commandArgs.push(`--coverage=${covProfileDir}`);
    }
    if (args["trace-ops"]) {
        commandArgs.push(`--trace-ops`);
    }
    commandArgs.push(path);
    if (args.update) {
        commandArgs.push("--", "--update");
    }

    const command = new Deno.Command(Deno.execPath(), {
        args: commandArgs,
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
