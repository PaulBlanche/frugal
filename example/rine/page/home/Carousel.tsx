import { clsx } from "../../dep/clsx.ts";
import { CarretLeft } from "../../icons/CarretLeft.tsx";
import { CarretRight } from "../../icons/CarretRight.tsx";
import styles from "./Carousel.module.css";

import {
  BACKGROUND_ID,
  NEXT_BUTTON_ID,
  PREVIOUS_BUTTON_ID,
} from "./Carousel.script.ts";

export function Carousel() {
  return (
    <div class={clsx(styles["carousel"])}>
      <div
        id={BACKGROUND_ID}
        class={clsx(styles["background"])}
      />
      <div class={clsx(styles["overlay"])} />

      <button
        id={PREVIOUS_BUTTON_ID}
        class={clsx(styles["navigation"], styles["previous"])}
      >
        <CarretLeft class={clsx(styles["icon"])} />
      </button>

      <Slide
        image="https://picsum.photos/2000/1000#1"
        title="Presentation"
        date="13 Septembre 2024"
        description="I'm sexy and i know it, managers in trouble."
        href="#"
      />
      <Slide
        image="https://picsum.photos/2000/1000#2"
        title="Workshop"
        date="15 Octobre 2024"
        description="When to fart, how to do it like an expert."
        href="#"
      />
      <Slide
        image="https://picsum.photos/2000/1000#3"
        title="Meetup"
        date="27 Octobre 2024"
        description="Let's all drink piss together"
        href="#"
        active
      />

      <button
        id={NEXT_BUTTON_ID}
        class={clsx(styles["navigation"], styles["next"])}
      >
        <CarretRight class={clsx(styles["icon"])} />
      </button>
    </div>
  );
}

type SlideProps = {
  image: string;
  href: string;
  title: string;
  date: string;
  description: string;
  active?: boolean;
};

function Slide(
  { image, href, title, date, description, active }: SlideProps,
) {
  return (
    <div
      data-carousel-slide
      data-carousel-slide-active={active}
      class={clsx(styles["slide"], active && styles["active"])}
    >
      <div class={clsx(styles["image"])}>
        <img src={image} />
      </div>
      <div class={clsx(styles["text"])}>
        <h2 class={clsx(styles["title"])}>{title}</h2>
        <time class={clsx(styles["date"])}>{date}</time>
        <h3 class={clsx(styles["description"])}>{description}</h3>
        <a class={clsx(styles["register"])} href={href}>Register</a>
      </div>
    </div>
  );
}
