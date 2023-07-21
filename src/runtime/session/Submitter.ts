import { Form, Method } from "./Form.ts";
import { Navigator } from "./Navigator.ts";
import * as utils from "./utils.ts";

export class Submitter {
    _form: Form;
    _navigator: Navigator;

    constructor(
        formWrapper: Form,
        navigator: Navigator,
    ) {
        this._form = formWrapper;
        this._navigator = navigator;
    }

    _shouldSubmit() {
        return this._form.method !== Method.DIALOG &&
            utils.isInternalUrl(this._navigator.url) &&
            this._navigator.shouldVisit(this._form.directive);
    }

    async submit(): Promise<boolean> {
        if (!this._shouldSubmit()) {
            return false;
        }

        const requestInit: RequestInit = {
            method: this._form.method,
        };

        if (requestInit.method !== Method.GET) {
            requestInit.body = this._form.body;
        }

        return await this._navigator.visit(requestInit);
    }
}
