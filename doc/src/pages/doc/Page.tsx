import { PageProps } from "$dep/frugal/runtime/preact.server.ts";
import { useData } from "$dep/frugal/runtime/preact.client.ts";
import * as marked from "./markdown/mod.ts";

import { Data } from "./type.ts";
import { DocLayout } from "../../layouts/doc/DocLayout.tsx";

export function Page(props: PageProps) {
    const { markdown, toc: siteToc } = useData<Data>();
    const { html, toc: pageToc } = marked.parse(markdown, siteToc.variables);

    return (
        <DocLayout {...props} pageToc={pageToc} siteToc={siteToc}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </DocLayout>
    );
}
