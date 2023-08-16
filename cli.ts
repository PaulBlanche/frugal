import { main } from "./src/cli/cli.ts";

if (import.meta.main) {
    await main();
}
