import { assertSnapshot } from "../../dep/std/testing/snapshot.ts";
import { config, log } from "../../src/log.ts";

Deno.test("log: default config", async (t) => {
    const logs: any[][] = [];
    console.log = (...params) => logs.push(params);

    logTest();

    assertSnapshot(t, logs);
});

Deno.test("log: custom config", async (t) => {
    const logs: any[][] = [];
    console.log = (...params) => logs.push(params);

    config({
        level: "error",
        scopes: {
            test2: "verbose",
        },
    });
    logTest();

    assertSnapshot(t, logs);
});

function logTest() {
    log("default");
    log("error", { scope: "test1", level: "error" });
    log(new Error("true error default"), { scope: "test1" });
    log(new Error("true error"), { scope: "test1", level: "info" });
    log("warning", { scope: "test1", level: "warning" });
    log("info", { scope: "test1", level: "info" });
    log("debug", { scope: "test1", level: "debug" });
    log("verbose", { scope: "test1", level: "verbose" });

    log("error", { scope: "test2", level: "error" });
    log("warning", { scope: "test2", level: "warning" });
    log("info", { scope: "test2", level: "info" });
    log("debug", { scope: "test2", level: "debug" });
    log("verbose", { scope: "test2", level: "verbose" });
}
