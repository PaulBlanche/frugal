if (import.meta.main) {
    const editors = document.querySelectorAll<HTMLElement>("[data-code]");

    editors.forEach((editor) => {
        const togglees = editor.querySelectorAll<HTMLElement>(`[data-id]`);

        const toggles = editor.querySelectorAll<HTMLElement>("[data-toggle-id");

        toggles.forEach((toggle) => {
            const togglee = editor.querySelector<HTMLElement>(`[data-id="${toggle.dataset.toggleId}"]`);
            if (togglee) {
                const toggleCode = () => {
                    toggles.forEach((toggle) => toggle.toggleAttribute("data-active", false));
                    togglees.forEach((togglee) => {
                        togglee.toggleAttribute("data-active", false);
                        togglee.setAttribute("aria-hidden", "true");
                    });
                    toggle.toggleAttribute("data-active", true);
                    togglee.toggleAttribute("data-active", true);
                    togglee.removeAttribute("aria-hidden");
                };

                toggle.addEventListener("click", toggleCode);
                toggle.addEventListener("touch", toggleCode);
            }
        });
    });
}
