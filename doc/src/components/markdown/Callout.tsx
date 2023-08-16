import { clsx } from "$dep/clsx.ts";
import * as icons from "$dep/frugal/doc/src/glyphs/icons/mod.ts";
import callout from "./Callout.module.css";

type CalloutProps = {
    kind: string;
    title: string;
    content: string;
};

const KINDS: Record<string, { title: string; icon: preact.ComponentChildren } | undefined> = {
    "warn": { title: "Warning", icon: <icons.Warning class={clsx(callout["icon"])} /> },
    "error": { title: "Error", icon: <icons.Error class={clsx(callout["icon"])} /> },
    "info": { title: "Info", icon: <icons.Info class={clsx(callout["icon"])} /> },
    "tip": { title: "Tip", icon: <icons.Bulb class={clsx(callout["icon"])} /> },
};

export function Callout({ kind, title, content }: CalloutProps) {
    return (
        <div class={clsx(callout["callout"], kind in KINDS && callout[kind])}>
            {KINDS[kind] && KINDS[kind]?.icon}
            <div
                class={clsx(callout["title"])}
                dangerouslySetInnerHTML={{ __html: title.trim() ? title : (KINDS[kind]?.title ?? kind) }}
            />
            {content.trim() && <div class={clsx(callout["content"])} dangerouslySetInnerHTML={{ __html: content }} />}
        </div>
    );
}
