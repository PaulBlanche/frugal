import { Head, PageProps } from "../../runtime/preact.server.ts";
import { Island1Island } from "./island1.island.tsx";
import "./session.script.ts";

export function Page1(props: PageProps) {
    const scriptSrc = props.assets["script"][props.descriptor];
    return (
        <div>
            <Head>
                {scriptSrc && <script type="module" src={scriptSrc} />}
            </Head>
            <span>Page 1</span>
            <Island1Island />
            <a href="/page2">page 2</a>
        </div>
    );
}
