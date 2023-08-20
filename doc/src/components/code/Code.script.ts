const REGISTERED = new WeakSet();

if (import.meta.environment === "client") {
    setup();

    addEventListener("frugal:readystatechange", (event) => {
        if (event.detail.readystate === "complete") {
            setup();
        }
    });
}

function setup() {
    const editors = document.querySelectorAll<HTMLElement>("[data-code]");

    editors.forEach((editor) => {
        if (!REGISTERED.has(editor)) {
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

            const copy = editor.querySelector("[data-copy]");
            if (copy) {
                copy.addEventListener("click", async () => {
                    let code: string | undefined;
                    for (const togglee of togglees) {
                        if (togglee.matches("[data-active]")) {
                            code = togglee.querySelector("pre")?.textContent ?? undefined;
                        }
                    }

                    if (code === undefined) {
                        return;
                    }

                    try {
                        await navigator.clipboard.writeText(code);
                        copy.toggleAttribute("data-success", true);
                        setTimeout(() => {
                            copy.toggleAttribute("data-success", false);
                        }, 2 * 1000);
                    } catch (error) {
                        console.log(error);
                    }
                });
            }

            REGISTERED.add(editor);
        }
    });
}
