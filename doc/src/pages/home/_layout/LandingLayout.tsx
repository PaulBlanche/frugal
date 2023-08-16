import { BaseLayout, BaseLayoutProps } from "../../_layout/BaseLayout.tsx";
import { Navigation } from "../../_layout/Navigation.tsx";
import { Footer } from "../../_layout/Footer.tsx";

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
