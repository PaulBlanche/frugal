import { assertSnapshot } from "../../dep/std/testing/snapshot.ts";
import { config, log } from "../../src/log.ts";

if (import.meta.main) {
    const logConfig = JSON.parse(Deno.env.get("LOG_CONFIG") ?? "{}");
    config(logConfig);

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

Deno.test("log: default config", async (t) => {
    const command = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", Deno.mainModule],
    });
    const output = await command.output();

    assertSnapshot(t, new TextDecoder().decode(output.stdout));
});

Deno.test("log: custom config", async (t) => {
    const command = new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", Deno.mainModule],
        env: {
            LOG_CONFIG: JSON.stringify({
                level: "error",
                scopes: {
                    test2: "verbose",
                },
            }),
        },
    });
    const output = await command.output();

    assertSnapshot(t, new TextDecoder().decode(output.stdout));
});
