import { PageProps } from "$dep/frugal/runtime/preact.server.ts";
import { useData } from "$dep/frugal/runtime/preact.client.ts";
import { parse } from "../../components/markdown/parse.ts";

import { Data } from "./type.ts";
import { DocLayout } from "./_layout/DocLayout.tsx";

export function Page(props: PageProps) {
    const { markdown, toc: siteToc, version } = useData<Data>();
    const { html, toc: pageToc } = parse(markdown, siteToc[version].variables);

    return (
        <DocLayout {...props} pageToc={pageToc} siteToc={siteToc} version={version}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </DocLayout>
    );
}
