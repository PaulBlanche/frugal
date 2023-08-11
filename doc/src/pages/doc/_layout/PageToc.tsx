import * as hooks from "preact/hooks";
import { signal } from "@preact/signals";
import { clsx } from "$dep/clsx.ts";

import pagetoc from "./PageToc.module.css";
import { throttle } from "../../../utils.ts";

export type PageTocProps = {
    pageToc: { label: string; id: string; level: number }[];
};

const active = signal("");

export function PageToc({ pageToc }: PageTocProps) {
    const ids = pageToc.map((entry) => entry.id);

    hooks.useEffect(() => {
        const sections = ids.map((id) => document.querySelector<HTMLElement>(`#${id}`)!);

        const throttledUpdateActiveSection = throttle(updateActiveSection, {
            timeout: 200,
            trailing: true,
            leading: true,
        });

        updateActiveSection();
        addEventListener("scroll", throttledUpdateActiveSection);

        return () => {
            active.value = "";
            removeEventListener("scroll", throttledUpdateActiveSection);
        };

        function updateActiveSection() {
            const progress = scrollProgress();
            let activeSection = sections[0];
            sections.forEach((element) => {
                if (elementScrollProgress(element) < progress) {
                    activeSection = element;
                }
            });
            active.value = activeSection?.id ?? "";
        }
    }, []);

    if (ids.length < 2) {
        return <></>;
    }

    return (
        <>
            <div class={clsx(pagetoc["wrapper"])}>
                <span class={clsx(pagetoc["title"])}>On this page</span>

                {pageToc.map(({ label, id, level }) => {
                    return (
                        <a
                            href={`#${id}`}
                            className={clsx(
                                pagetoc["link"],
                                id === active.value && pagetoc["active"],
                                level === 1 && pagetoc["sub"],
                            )}
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                })}
            </div>
        </>
    );
}

function scrollProgress() {
    const windowHeight = window.innerHeight ??
        document.documentElement.clientHeight ??
        document.body.clientHeight ?? 0;

    const scrollY = window.scrollY ??
        document.body.scrollTop ??
        document.documentElement.scrollTop ?? 0;

    const documentHeight = Math.max(
        document.body.scrollHeight ?? 0,
        document.documentElement.scrollHeight ?? 0,
        document.body.offsetHeight ?? 0,
        document.documentElement.offsetHeight ?? 0,
        document.body.clientHeight ?? 0,
        document.documentElement.clientHeight ?? 0,
    );

    return Math.max(0, Math.min(1, scrollY / (documentHeight - windowHeight)));
}

function elementScrollProgress(element: HTMLElement) {
    const windowHeight = window.innerHeight ??
        document.documentElement.clientHeight ??
        document.body.clientHeight ?? 0;

    const rect = element.getBoundingClientRect();

    return rect.top / windowHeight;
}
