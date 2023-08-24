import { Island } from "../../../../runtime/preact.client.ts";
import { NAME } from "./DynamicIsland.script.ts";
import { Dynamic } from "./Dynamic.tsx";

export function DynamicIsland() {
    return <Island name={NAME} strategy="visible" Component={Dynamic} />;
}
