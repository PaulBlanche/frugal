export const HERO_ID = "hero";
export const NAV_ID = "nav";

function Navigation() {
    const hero = document.querySelector(`#${HERO_ID}`)!;
    const nav = document.querySelector(`#${NAV_ID}`)!;

    const observer = new IntersectionObserver(
        ([entry]) => {
            nav.toggleAttribute("data-small", entry.intersectionRatio < 0.8);
            setTimeout(() => nav.toggleAttribute("data-animated", true), 100);
        },
        { threshold: [0.8] },
    );

    return {
        start() {
            observer.observe(hero);
            addEventListener("scroll", () => {
                nav.toggleAttribute("data-shadow", (document.scrollingElement?.scrollTop ?? 0) > 0);
            });
        },
    };
}

if (import.meta.main) {
    Navigation().start();
}
