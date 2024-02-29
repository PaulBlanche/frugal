/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import { Island } from "../../../../runtime/solidjs.client.ts";
import { NAME } from "./DynamicIsland.script.ts";
import { Dynamic } from "./Dynamic.tsx";

export function DynamicIsland() {
    return <Island name={NAME} strategy="visible" Component={Dynamic} />;
}
