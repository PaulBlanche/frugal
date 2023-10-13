import * as test from "node:test";
import * as assert from "node:assert/strict";
import * as url from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";
import * as jsonvalue from "../src/page/JSONValue.js";

/** @param {string} moduleUrl */
export async function init(moduleUrl) {
    const snapshot = new Snapshot(moduleUrl);
    await snapshot.load();
    return snapshot;
}

/** @typedef {Parameters<Exclude<Parameters<test.test>[0], undefined>>[0]} TestContext */

class Snapshot {
    /** @type {string} */
    #path;
    /** @type {Map<string, { value: jsonvalue.HashableJsonValue; context?: TestContext }>} */
    #snapshots;
    /** @type {Map<string, { count: number; context: TestContext }>} */
    #state;

    /** @param {string} moduleUrl */
    constructor(moduleUrl) {
        const testFilePath = url.fileURLToPath(moduleUrl);
        this.#path = path.resolve(
            path.dirname(testFilePath),
            "__snap__",
            `${path.basename(testFilePath)}.json`,
        );
        this.#snapshots = new Map();
        this.#state = new Map();
    }

    async load() {
        try {
            const snapshotData = await fs.promises.readFile(this.#path, { encoding: "utf8" });
            this.#snapshots = new Map(
                Object.entries(JSON.parse(snapshotData)).map(([name, value]) => {
                    return [name, { value, context: undefined }];
                }),
            );
        } catch (/** @type {any} */ error) {
            if (error.code === "ENOENT") {
                this.#snapshots = new Map();
                return;
            }
            throw error;
        }
    }

    async dispose() {
        if (!isUpdating()) {
            return;
        }

        const serializedSnapshot = JSON.stringify(
            Object.fromEntries(
                Array.from(this.#snapshots.entries())
                    .filter(([_, entry]) => {
                        return entry.context !== undefined;
                    })
                    .map(([name, entry]) => {
                        console.log(`saving snapshot ${name}`);
                        return [name, entry.value];
                    }),
            ),
            null,
            2,
        );
        await fs.promises.mkdir(path.dirname(this.#path), { recursive: true });
        await fs.promises.writeFile(this.#path, serializedSnapshot, { encoding: "utf-8" });
    }

    /**
     * @param {Parameters<Exclude<Parameters<test.test>[0], undefined>>[0]} context
     * @param {jsonvalue.JSONValue} actual
     * @param {string | Error} [message]
     */
    assert(context, actual, message) {
        const snapshotName = context.name;
        const testState = this.#state.get(context.name);

        if (testState && testState.context !== context) {
            throw Error("snapshot override");
        }

        const count = testState?.count ?? 1;

        this.#state.set(snapshotName, { count: count + 1, context });

        const serializedActual = jsonvalue.hashableJsonValue(actual);
        const snapshotEntryName = `${snapshotName}:${count}`;

        if (isUpdating()) {
            this.#snapshots.set(snapshotEntryName, { value: serializedActual, used: true });
        }

        const expected = this.#snapshots.get(snapshotEntryName);

        if (expected === undefined) {
            throw Error("no snapshot found for the test. Try updating");
        }

        expected.context = context;
        assert.deepEqual(serializedActual, expected.value, message);
    }
}

function isUpdating() {
    return process.env["UPDATE_SNAPSHOT"] !== undefined;
}
