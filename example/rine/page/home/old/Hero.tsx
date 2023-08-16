import { CarretLeft } from "../../icons/CarretLeft.tsx";
import { CarretRight } from "../../icons/CarretRight.tsx";
import { HERO_ID } from "./Navigation.script.ts";
import styles from "./Hero.module.css";
import { clsx } from "../../dep/clsx.ts";

export function Hero() {
    return (
        <Carousel>
            <CarouselSlide
                title="Workshop"
                active
                date={new Date("17 Septembre 2078")}
                description="When and how to branle, a retrospective on branling as a science"
                backgroundSrc="https://picsum.photos/2000/1000#1"
                href="#"
            />
            <CarouselSlide
                title="Conference"
                date={new Date("17 Mars 2032")}
                description="Not to brag, but i fucked your mom last night"
                backgroundSrc="https://picsum.photos/2000/1000#2"
                href="#"
            />
            <CarouselSlide
                title="Meetup"
                date={new Date("29 Fevrier 2018")}
                description="Let's meet and drink piss together"
                backgroundSrc="https://picsum.photos/2000/1000#3"
                href="#"
            />
        </Carousel>
    );
}

type CarouselSlideProps = {
    backgroundSrc: string;
    href: string;
    title: string;
    date: Date;
    description: string;
    active?: boolean;
};

function CarouselSlide({ backgroundSrc, href, title, date, description, active }: CarouselSlideProps) {
    return (
        <div class={clsx(styles["slide"])} data-active={active}>
            <div class={clsx(styles["slide-content"])}>
                <h1>{title}</h1>
                <time>{date.toLocaleDateString(["fr-FR"])}</time>
                <h2>{description}</h2>
                <a href={href}>Register</a>
            </div>
            <div class={clsx(styles["overlay"])} />
            <div class={clsx(styles["background"])} style={`background-image:url('${backgroundSrc}');`} />
        </div>
    );
}

type CarouselProps = { children: preact.ComponentChildren };

function Carousel({ children }: CarouselProps) {
    return (
        <header id={HERO_ID} class={clsx(styles["hero"])}>
            <div class={clsx(styles["navigation"], styles["previous"])}>
                <button class={clsx(styles["navigate"])} aria-label="previous">
                    <CarretLeft class={clsx(styles["icon"])} />
                </button>
            </div>

            <div class={clsx(styles["navigation"], styles["next"])}>
                <button class={clsx(styles["navigate"])} aria-label="next">
                    <CarretRight class={clsx(styles["icon"])} />
                </button>
            </div>

            {children}
        </header>
    );
}
