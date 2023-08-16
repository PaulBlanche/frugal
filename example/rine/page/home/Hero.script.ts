export const BUTTON_ID = "scroll-down-button";

if (import.meta.main) {
  const button = document.querySelector(`#${BUTTON_ID}`)!;
  const main = document.querySelector("main")!;

  button.addEventListener("click", () => {
    main.scrollIntoView({
      behavior: "smooth",
    });
  });
}
