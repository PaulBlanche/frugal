import { Navigator, NavigatorConfig } from "./Navigator.ts";
import { Submitter } from "./Submitter.ts";
import { Form, Method } from "./Form.ts";

export class SubmitObserver {
    _config: NavigatorConfig;
    _observing: boolean;

    constructor(config: NavigatorConfig) {
        this._config = config;
        this._observing = false;
    }

    observe() {
        if (this._observing) {
            return;
        }
        this._observing = true;

        const submit = this.submit.bind(this);
        document.addEventListener("submit", submit, { capture: false });

        return () => {
            document.removeEventListener("submit", submit, { capture: false });
        };
    }

    async submit(event: SubmitEvent) {
        if (
            !event.cancelable || event.defaultPrevented ||
            !(event.target instanceof HTMLFormElement)
        ) {
            return;
        }

        const form = new Form(event.target, event.submitter);

        if (form.method === Method.DIALOG) {
            return;
        }

        const navigator = new Navigator(form.url, this._config);
        const submitter = new Submitter(form, navigator);

        event.preventDefault();
        try {
            const result = await submitter.submit();
            if (!result.success) {
                form.submit();
            }
        } catch (error) {
            console.error(error);
            form.submit();
        }
    }
}
