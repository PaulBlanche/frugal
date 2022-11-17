/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from 'preact/hooks';
import * as signal from 'preact/signals';
import { cx } from '../../../dep/frugal/styled.ts';

import * as s from './MobileToggle.style.ts';
import * as svg from '../../../svg/mod.ts';
import { FOOTER_CLASSNAME } from '../../_layout/Footer.tsx';
import { navigationWithButton } from '../../_layout/Navigation.style.ts';
import { NAVIGATION_CLASS } from '../../_layout/Navigation.tsx';

export const DRAWER_CLASSNAME = 'mobile-toggle-drawer';
export const OVERLAY_CLASSNAME = 'mobile-toggle-overlay';
export const MAIN_CLASSNAME = 'mobile-toggle-main';

type MobileProps = {
    toggler?: Toggler;
};

export function MobileToggle({ toggler }: MobileProps) {
    hooks.useLayoutEffect(() => {
        return () => {
            toggler?.unmount();
        };
    }, []);

    return (
        <button
            onClick={() => toggler?.toggle()}
            class={cx(s.toggle)}
        >
            <svg.Toc class={cx(s.icon)} />
        </button>
    );
}

type TogglerUi = {
    drawer?: HTMLElement | null;
    overlay?: HTMLElement | null;
    main?: HTMLElement | null;
    footer?: HTMLElement | null;
    navigation?: HTMLElement | null;
};

export class Toggler {
    open: signal.Signal<boolean>;
    #ui?: TogglerUi;
    #matchMedia?: MediaQueryList;
    #handleOverlayClick?: (event: MouseEvent) => void;
    #handleMatchChange?: (event: MediaQueryListEvent) => void;
    #handleKeyDown?: (event: KeyboardEvent) => void;
    #handleNavigation?: (
        event: CustomEvent<{ readystate: DocumentReadyState }>,
    ) => void;
    #unsubscribe?: () => void;

    constructor(open: signal.Signal<boolean>) {
        this.open = open;
    }

    mount() {
        this.#matchMedia = matchMedia('(min-width: 900px)');

        addEventListener(
            'frugal:readystatechange',
            this.#getHandleNavigation(),
        );

        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://esm.sh/wicg-inert@3.1.2';
        document.body.appendChild(script);

        this.#setup();
    }

    onOpen() {
        if (!this.#matchMedia) return;

        const ui = this.#getUi();

        if (this.#matchMedia.matches) {
            return;
        }

        ui.drawer?.removeAttribute('inert');
        ui.drawer?.classList.remove(cx(s.drawerClose));
        ui.drawer?.classList.add(cx(s.drawerOpen));
        ui.overlay?.classList.add(cx(s.overlayOpen));
        document.body.classList.add('no-scroll');
        addEventListener('keydown', this.#getHandleKeyDown());
        ui.main?.setAttribute('inert', '');
        ui.footer?.setAttribute('inert', '');
    }

    onClose() {
        if (!this.#matchMedia) return;

        const ui = this.#getUi();

        if (this.#matchMedia.matches) {
            return;
        }

        ui.main?.removeAttribute('inert');
        ui.footer?.removeAttribute('inert');
        ui.drawer?.classList.add(cx(s.drawerClose));
        ui.drawer?.classList.remove(cx(s.drawerOpen));
        ui.overlay?.classList.remove(cx(s.overlayOpen));
        document.body.classList.remove('no-scroll');
        removeEventListener('keydown', this.#getHandleKeyDown());
        ui.drawer?.setAttribute('inert', '');
    }

    toggle() {
        this.open.value = !this.open.value;
    }

    unmount() {
        this.#cleanup();
        this.#matchMedia?.removeEventListener(
            'change',
            this.#getHandleMatchChange(),
        );
        removeEventListener(
            'frugal:readystatechange',
            this.#getHandleNavigation(),
        );
    }

    #setup() {
        if (!this.#matchMedia) return;

        const ui = this.#getUi();

        if (!this.#matchMedia.matches) {
            ui.navigation?.classList.add(cx(navigationWithButton));
            ui.overlay?.addEventListener(
                'click',
                this.#getHandleOverlayClick(),
            );
            let first = false;
            this.#unsubscribe = this.open.subscribe((open) => {
                if (!first) {
                    first = true;
                    return;
                }

                if (open) {
                    this.onOpen();
                } else {
                    this.onClose();
                }
            });
        }
        this.#matchMedia.addEventListener(
            'change',
            this.#getHandleMatchChange(),
        );
    }

    #cleanup() {
        const ui = this.#getUi();

        ui.drawer?.removeAttribute('inert');
        ui.main?.removeAttribute('inert');
        ui.footer?.removeAttribute('inert');
        ui.overlay?.removeEventListener(
            'click',
            this.#getHandleOverlayClick(),
        );
        removeEventListener('keydown', this.#getHandleKeyDown());
        ui.drawer?.classList.remove(
            cx(s.drawerOpen),
            cx(s.drawerClose),
        );
        ui.overlay?.classList.remove(cx(s.overlayOpen));
        document.body.classList.remove('no-scroll');
        this.#unsubscribe?.();
    }

    #getUi(): TogglerUi {
        const drawer = document.querySelector<HTMLElement>(
            `.${DRAWER_CLASSNAME}`,
        );
        const overlay = document.querySelector<HTMLElement>(
            `.${OVERLAY_CLASSNAME}`,
        );
        const main = document.querySelector<HTMLElement>(`.${MAIN_CLASSNAME}`);
        const footer = document.querySelector<HTMLElement>(
            `.${FOOTER_CLASSNAME}`,
        );
        const navigation = document.querySelector<HTMLElement>(
            `.${NAVIGATION_CLASS}`,
        );

        return { drawer, overlay, main, footer, navigation };
    }

    #getHandleOverlayClick() {
        if (this.#handleOverlayClick === undefined) {
            this.#handleOverlayClick = (event: MouseEvent) => {
                this.open.value = !this.open.value;
            };
        }
        return this.#handleOverlayClick;
    }

    #getHandleMatchChange() {
        if (this.#handleMatchChange === undefined) {
            this.#handleMatchChange = (event: MediaQueryListEvent) => {
                if (!event.matches) {
                    this.#setup();
                } else {
                    this.open.value = false;
                    this.#cleanup();
                }
            };
        }
        return this.#handleMatchChange;
    }

    #getHandleKeyDown() {
        if (this.#handleKeyDown === undefined) {
            this.#handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape' && this.open.value) {
                    this.open.value = false;
                }
            };
        }
        return this.#handleKeyDown;
    }

    #getHandleNavigation() {
        if (this.#handleNavigation === undefined) {
            this.#handleNavigation = (
                event: CustomEvent<{ readystate: DocumentReadyState }>,
            ) => {
                if (event.detail.readystate === 'interactive') {
                    this.open.value = false;
                    this.#setup();
                }
            };
        }
        return this.#handleNavigation;
    }
}
