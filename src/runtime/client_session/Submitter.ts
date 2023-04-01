import { Form, Method } from './Form.ts';
import { Navigator } from './Navigator.ts';
import * as utils from './utils.ts';

export class Submitter {
  #form: Form;
  #navigator: Navigator;

  constructor(
    formWrapper: Form,
    navigator: Navigator,
  ) {
    this.#form = formWrapper;
    this.#navigator = navigator;
  }

  #shouldSubmit() {
    return this.#form.method !== Method.DIALOG &&
      utils.isInternalUrl(this.#navigator.url) &&
      this.#navigator.shouldVisit(this.#form.directive);
  }

  async submit(): Promise<boolean> {
    if (!this.#shouldSubmit()) {
      return false;
    }

    const requestInit: RequestInit = {
      method: this.#form.method,
    };

    if (requestInit.method !== Method.GET) {
      requestInit.body = this.#form.body;
    }

    return await this.#navigator.visit(requestInit);
  }
}
