import { BaseLayout, BaseLayoutProps } from "../base/BaseLayout.tsx";
import { Navigation } from "./Navigation.tsx";
import { Footer } from "./Footer.tsx";

type LandingLayoutProps = BaseLayoutProps;

export function LandingLayout({ children, ...props }: LandingLayoutProps) {
    return (
        <BaseLayout {...props}>
            <Navigation />
            {children}
            <Footer />
        </BaseLayout>
    );
}
