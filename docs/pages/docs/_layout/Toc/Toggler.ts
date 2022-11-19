import * as signal from 'preact/signals';
import { FocusTrap, type FocusTrapConfig } from './FocusTrap.ts';

export class TocToggler {
    #dispose?: () => void;
    #openSignal: signal.Signal<boolean>;
    #focusTrap: FocusTrap;

    constructor(
        open: signal.Signal<boolean>,
        focusTrapConfig: FocusTrapConfig,
    ) {
        this.#openSignal = open;
        this.#focusTrap = new FocusTrap(focusTrapConfig);
    }

    mount() {
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && this.#openSignal.value) {
                this.#openSignal.value = false;
            }
        };

        const handleReadyStateChange = (event: FrugalReadyStateChangeEvent) => {
            if (event.detail.readystate === 'interactive') {
                this.#openSignal.value = false;
            }
        };

        this.#dispose = signal.effect(() => {
            if (this.#openSignal.value) {
                addEventListener('keydown', handleKeydown);
                addEventListener(
                    'frugal:readystatechange',
                    handleReadyStateChange,
                );
                this.#focusTrap.activate();
            } else {
                removeEventListener('keydown', handleKeydown);
                removeEventListener(
                    'frugal:readystatechange',
                    handleReadyStateChange,
                );
                this.#focusTrap.release();
            }
        });
    }

    unmount() {
        if (this.#dispose) {
            this.#dispose();
        }
    }
}
