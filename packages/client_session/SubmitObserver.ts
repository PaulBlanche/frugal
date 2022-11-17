import * as utils from './utils.ts';
import { Navigator, NavigatorConfig } from './Navigator.ts';
import { Submitter } from './Submitter.ts';

export class SubmitObserver {
    #config: NavigatorConfig;
    #observing: boolean;

    constructor(config: NavigatorConfig) {
        this.#config = config;
        this.#observing = false;
    }

    observe() {
        if (this.#observing) {
            return;
        }
        this.#observing = true;

        const submit = this.submit.bind(this);
        document.addEventListener('submit', submit, { capture: false });

        return () => {
            document.removeEventListener('submit', submit, { capture: false });
        };
    }

    async submit(event: SubmitEvent) {
        console.log('submit', event);
        const form = event.target;
        if (
            !event.cancelable || event.defaultPrevented ||
            !(form instanceof HTMLFormElement)
        ) {
            return;
        }

        console.log('coucou');

        const formSubmitter = event.submitter;

        const url = utils.getFormUrl(form, formSubmitter);
        const navigator = new Navigator(url, this.#config);
        const submitter = new Submitter(form, event.submitter, navigator);

        event.preventDefault();
        try {
            const result = await submitter.submit();
            if (!result) {
                form.submit();
            }
        } catch (error) {
            console.error(error);
            form.submit();
        }
    }
}
