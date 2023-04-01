import { Navigator, NavigatorConfig } from './Navigator.ts';
import { Submitter } from './Submitter.ts';
import { Form, Method } from './Form.ts';

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

    const navigator = new Navigator(form.url, this.#config);
    const submitter = new Submitter(form, navigator);

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
