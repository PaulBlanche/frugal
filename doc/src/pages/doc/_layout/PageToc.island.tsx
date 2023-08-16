import { Island } from "$dep/frugal/runtime/preact.client.ts";

import { NAME } from "./PageToc.script.ts";
import { PageToc, PageTocProps } from "./PageToc.tsx";

export function PageTocIsland(props: PageTocProps) {
    return <Island name={NAME} Component={PageToc} props={props} />;
}
