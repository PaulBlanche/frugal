import { Head, PageProps } from "../../runtime/preact.server.ts";
import { Island1Island } from "./island1.island.tsx";
import { Island2Island } from "./island2.island.tsx";
import "./session.script.ts";

export function Page2(props: PageProps) {
    const scriptSrc = props.assets["script"][props.descriptor];
    return (
        <div>
            <Head>
                {scriptSrc && <script type="module" src={scriptSrc} />}
            </Head>
            <span>Page 2</span>
            <Island2Island />
            <Island1Island />
            <a href="/page1">page 1</a>
        </div>
    );
}
