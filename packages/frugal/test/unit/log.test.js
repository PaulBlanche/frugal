import { test, mock } from "node:test";
import { init } from "../snapshot.js";

import { config, log } from "../../src/log.js";

const snapshot = await init(import.meta.url);

await test("#log: default config", async (t) => {
    /** @type {any[][]} */
    const logs = [];
    const initialLog = console.log;
    console.log = (...params) => logs.push(params);

    logTest();

    console.log = initialLog;

    snapshot.assert(t, logs);
});

await test("#log: custom config", async (t) => {
    /** @type {any[][]} */
    const logs = [];
    const initialLog = console.log;
    console.log = (...params) => logs.push(params);

    config({
        level: "error",
        scopes: {
            test2: "verbose",
        },
    });
    logTest();

    console.log = initialLog;

    snapshot.assert(t, logs);
});

await snapshot.dispose();

function logTest() {
    const tick = mockDate();
    log("default");
    tick(2000);
    log("error", { scope: "test1", level: "error" });
    tick(2000);
    log(mockStack(new Error("true error default")), { scope: "test1" });
    tick(2000);
    log(mockStack(new Error("true error")), { scope: "test1", level: "info" });
    tick(2000);
    log("warning", { scope: "test1", level: "warning" });
    tick(2000);
    log("info", { scope: "test1", level: "info" });
    tick(2000);
    log("debug", { scope: "test1", level: "debug" });
    tick(2000);
    log("verbose", { scope: "test1", level: "verbose" });
    tick(2000);

    log("error", { scope: "test2", level: "error" });
    tick(2000);
    log("warning", { scope: "test2", level: "warning" });
    tick(2000);
    log("info", { scope: "test2", level: "info" });
    tick(2000);
    log("debug", { scope: "test2", level: "debug" });
    tick(2000);
    log("verbose", { scope: "test2", level: "verbose" });
}

/**
 * @param {Error} error
 * @returns
 */
function mockStack(error) {
    error.stack = "[mocked error stack]";
    return error;
}

function mockDate() {
    let currentTimestamp = 0;
    const originalDate = Date;
    global.Date = function () {
        return new originalDate(currentTimestamp);
    };

    /** @param {number} ms */
    return (ms) => {
        currentTimestamp += ms;
    };
}
