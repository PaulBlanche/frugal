import { PageProps } from "$dep/frugal/runtime/preact.server.ts";
import { useData } from "$dep/frugal/runtime/preact.client.ts";

import { Data } from "./type.ts";
import { BlogLayout } from "../_layout/BlogLayout.tsx";
import { clsx } from "$dep/clsx.ts";

import page from "./Page.module.css";

export function Page(props: PageProps) {
    const { entries } = useData<Data>();

    return (
        <BlogLayout {...props}>
            <div class={clsx(page["head"])}>
                <h1 class={clsx(page["page-title"])}>Blog</h1>
            </div>
            {entries.map((entry) => {
                return (
                    <a class={clsx(page["link"])} href={`/blog/${entry.slug}`}>
                        <section class={clsx(page["section"])}>
                            <header class={clsx(page["header"])} style={`background-image:url("${entry.splash}");`}>
                            </header>
                            <div class={clsx(page["content"])}>
                                <div class={clsx(page["time"])}>
                                    {new Date(entry.date).toLocaleDateString("en", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </div>
                                <h1 class={clsx(page["title"])}>{entry.title}</h1>
                                <p>{entry.headline}</p>
                            </div>
                        </section>
                    </a>
                );
            })}
        </BlogLayout>
    );
}
