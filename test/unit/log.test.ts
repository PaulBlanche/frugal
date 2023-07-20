import { assertSnapshot } from "../../dep/std/testing/snapshot.ts";
import { FakeTime } from "../../dep/std/testing/time.ts";
import { config, log } from "../../src/log.ts";

Deno.test("log: default config", async (t) => {
    const logs: any[][] = [];
    console.log = (...params) => logs.push(params);

    const time = new FakeTime(0);

    logTest(time);

    time.restore();

    assertSnapshot(t, logs);
});

Deno.test("log: custom config", async (t) => {
    const logs: any[][] = [];
    console.log = (...params) => logs.push(params);

    const time = new FakeTime(0);

    config({
        level: "error",
        scopes: {
            test2: "verbose",
        },
    });
    logTest(time);

    time.restore();

    assertSnapshot(t, logs);
});

function logTest(time: FakeTime) {
    log("default");
    time.tick(2000);
    log("error", { scope: "test1", level: "error" });
    time.tick(2000);
    log(new Error("true error default"), { scope: "test1" });
    time.tick(2000);
    log(new Error("true error"), { scope: "test1", level: "info" });
    time.tick(2000);
    log("warning", { scope: "test1", level: "warning" });
    time.tick(2000);
    log("info", { scope: "test1", level: "info" });
    time.tick(2000);
    log("debug", { scope: "test1", level: "debug" });
    time.tick(2000);
    log("verbose", { scope: "test1", level: "verbose" });
    time.tick(2000);

    log("error", { scope: "test2", level: "error" });
    time.tick(2000);
    log("warning", { scope: "test2", level: "warning" });
    time.tick(2000);
    log("info", { scope: "test2", level: "info" });
    time.tick(2000);
    log("debug", { scope: "test2", level: "debug" });
    time.tick(2000);
    log("verbose", { scope: "test2", level: "verbose" });
}
