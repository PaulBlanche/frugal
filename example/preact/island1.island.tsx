import { Island } from "../../src/runtime/preact/Island.tsx";
import { NAME } from "./island1.script.ts";
import { Island1 } from "./island1.tsx";

export function Island1Island() {
    return <Island name={NAME} Component={Island1} />;
}
