export const NEXT_BUTTON_ID = "carousel-next";
export const PREVIOUS_BUTTON_ID = "carousel-previous";
export const BACKGROUND_ID = "carousel-background";

if (import.meta.main) {
  const next = document.querySelector(`#${NEXT_BUTTON_ID}`)!;
  const previous = document.querySelector(`#${PREVIOUS_BUTTON_ID}`)!;
  const background = document.querySelector<HTMLElement>(`#${BACKGROUND_ID}`)!;
  const slides = document.querySelectorAll<HTMLElement>(
    "[data-carousel-slide]",
  );

  const apply = (activeIndex: number, slides: NodeListOf<HTMLElement>) => {
    const zindex = getZindex(activeIndex, slides.length);

    slides.forEach((slide, i) => {
      slide.style.zIndex = String(zindex[i]);
      slide.toggleAttribute("data-carousel-slide-active", i === activeIndex);
      if (i === activeIndex) {
        const image = slide.querySelector("img")!;
        background.style.backgroundImage = `url("${image.src}")`;
      }
    });
  };

  let activeIndex = -1;
  slides.forEach((slide, i) => {
    if (slide.hasAttribute("data-carousel-slide-active")) {
      activeIndex = i;
    }
  });

  apply(activeIndex, slides);

  next.addEventListener("click", () => {
    const nextActiveIndex =
      (((activeIndex + 1) % slides.length) + slides.length) % slides.length;
    activeIndex = nextActiveIndex;
    apply(nextActiveIndex, slides);
  });

  previous.addEventListener("click", () => {
    const nextActiveIndex =
      (((activeIndex - 1) % slides.length) + slides.length) % slides.length;
    activeIndex = nextActiveIndex;
    apply(nextActiveIndex, slides);
  });
}

function getZindex(activeIndex: number, length: number) {
  const zindex = Array.from({ length }, (_, i) => i);
  return [
    ...zindex.slice(-(activeIndex + 1)),
    ...zindex.slice(0, -(activeIndex + 1)),
  ];
}
