export type FocusTrapConfig = {
    target: string;
    includes: string;
};

export class FocusTrap {
    #target: string;
    #includes: string;
    #inerts: HTMLElement[];

    constructor({ target, includes }: FocusTrapConfig) {
        this.#inerts = [];
        this.#includes = includes;
        this.#target = target;
    }

    activate() {
        if (this.#target === undefined || typeof document === 'undefined') {
            return;
        }

        document.body.classList.add('no-scroll');
        let current = document.querySelector(this.#target);
        while (current && current !== document.body && current.parentElement) {
            current.parentElement.childNodes.forEach((node) => {
                if (
                    node instanceof HTMLElement &&
                    node !== current && !node.matches(this.#includes)
                ) {
                    if (!node.hasAttribute('inert')) {
                        node.setAttribute('inert', '');
                        this.#inerts.push(node);
                    }
                }
            });
            current = current.parentElement;
        }
    }

    release() {
        if (this.#target === undefined || typeof document === 'undefined') {
            return;
        }

        document.body.classList.remove('no-scroll');
        this.#inerts.forEach((element) => {
            element.removeAttribute('inert');
        });
    }
}
