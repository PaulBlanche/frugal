import { PageProps } from "$dep/frugal/runtime/preact.server.ts";
import { useData } from "$dep/frugal/runtime/preact.client.ts";
import { parse } from "../../../components/markdown/parse.ts";

import { Data } from "./type.ts";
import { BlogLayout } from "../_layout/BlogLayout.tsx";
import { clsx } from "$dep/clsx.ts";

import page from "./Page.module.css";

export function Page(props: PageProps) {
    const { markdown, splash, title, date } = useData<Data>();
    const { html } = parse(markdown);

    return (
        <BlogLayout {...props}>
            <article>
                <header class={clsx(page["header"])} style={`background-image:url("${splash}");`}>
                    <div class={clsx(page["time"])}>
                        {new Date(date).toLocaleDateString("en", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                    <h1 class={clsx(page["title"])}>{title}</h1>
                </header>
                <section class={clsx(page["content"])} dangerouslySetInnerHTML={{ __html: html }} />
            </article>
        </BlogLayout>
    );
}
