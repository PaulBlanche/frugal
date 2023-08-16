import { Island } from "../../src/runtime/preact/Island.tsx";
import { NAME } from "./island2.script.ts";
import { Island2 } from "./island2.tsx";

export function Island2Island() {
    return <Island name={NAME} Component={Island2} />;
}
