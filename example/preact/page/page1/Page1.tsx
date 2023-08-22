import { Head, PageProps } from "../../../../runtime/preact.server.ts";
import { SharedCounterIsland } from "../component/counter/SharedCounterIsland.tsx";
import "../session.script.ts";

export function Page1(props: PageProps) {
    const scripts = props.assets.get("script");
    return (
        <div>
            <Head>
                {scripts.map((src) => {
                    return <script type="module" src={src} />;
                })}
            </Head>
            <span>Page 1</span>
            <div style="border:1px solid black;">
                <SharedCounterIsland page="page 1" />
            </div>
            <a href="/page2">page 2</a>
        </div>
    );
}
