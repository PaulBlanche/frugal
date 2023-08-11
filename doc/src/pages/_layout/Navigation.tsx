import { usePathname } from "$dep/frugal/runtime/preact.client.ts";
import { clsx } from "$dep/clsx.ts";

import navigation from "./Navigation.module.css";
import { Github } from "../../glyphs/icons/Github.tsx";

import versions from "../../../../versions.json" assert { type: "json" };

export function Navigation() {
    const pathname = usePathname();

    const isHome = pathname === "/";
    const isDocs = pathname.startsWith("/doc");
    const isBlog = pathname.startsWith("/blog");

    return (
        <nav class={clsx(navigation["navigation"])}>
            <div class={clsx(navigation["navigation-container"])}>
                <NavigationEntry active={isHome} href="/">
                    Home
                </NavigationEntry>
                <NavigationEntry active={isDocs} href={`/doc@${versions[0]}`}>
                    Docs
                </NavigationEntry>
                <NavigationEntry active={isBlog} href={"/blog"}>
                    Blog
                </NavigationEntry>
            </div>
            <a
                class={clsx(navigation["github-link"])}
                href="https://github.com/PaulBlanche/frugal"
                aria-label="Source code on Github"
            >
                <Github width="32" class={clsx(navigation["icon"])} />
            </a>
        </nav>
    );
}

type NavigationEntryProps = {
    children: preact.ComponentChildren;
    active?: boolean;
    href?: string;
};

function NavigationEntry(
    { active = false, children, href }: NavigationEntryProps,
) {
    if (active) {
        return (
            <span class={clsx(navigation["entry-active"])}>
                {children}
            </span>
        );
    }
    return (
        <a class={clsx(navigation["entry"])} href={href}>
            {children}
        </a>
    );
}
