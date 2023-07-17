import styles from "./Hero.module.css";
import { clsx } from "../../dep/clsx.ts";
import { HERO_ID } from "./Navigation.script.ts";
import { CarretStrokeDown } from "../../icons/CarretStrokeDown.tsx";
import { Carousel } from "./Carousel.tsx";

import { BUTTON_ID } from "./Hero.script.ts";

export function Hero() {
  return (
    <header id={HERO_ID} class={clsx(styles["hero"])}>
      <Carousel />

      <div class={clsx(styles["down-positionner"])}>
        <button id={BUTTON_ID} class={clsx(styles["button"])}>
          <CarretStrokeDown class={clsx(styles["down-icon"])} />
        </button>
      </div>
    </header>
  );
}
