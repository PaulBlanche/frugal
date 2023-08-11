import { BaseLayout, BaseLayoutProps } from "../../_layout/BaseLayout.tsx";
import { Navigation } from "../../_layout/Navigation.tsx";
import { Footer } from "../../_layout/Footer.tsx";

import layout from "./BlogLayout.module.css";
import { clsx } from "$dep/clsx.ts";

export function BlogLayout({ children, ...rest }: BaseLayoutProps) {
    return (
        <BaseLayout {...rest}>
            <Navigation />
            <main class={clsx(layout["main"])}>
                <div>{children}</div>
                <Footer class={clsx(layout["footer"])} />
            </main>
        </BaseLayout>
    );
}
