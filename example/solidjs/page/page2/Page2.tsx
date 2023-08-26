/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import { Head, PageProps } from "../../../../runtime/preact.server.ts";
import { SharedCounterIsland } from "../component/counter/SharedCounterIsland.tsx";
import "../session.script.ts";
import { DynamicIsland } from "./DynamicIsland.tsx";

export function Page2(props: PageProps) {
    const scripts = props.assets.get("script");
    return (
        <>
            <div>
                <span>Page 2</span>
                <div style="border:1px solid black;">
                    <SharedCounterIsland page="page 2" />
                </div>
                <a href="/page1">page 1</a>
                <span>scroll down ...</span>
                <div style="height:1000px">
                </div>
                <DynamicIsland />
            </div>
            {scripts.map((src) => {
                return <script type="module" src={src} />;
            })}
        </>
    );
}
