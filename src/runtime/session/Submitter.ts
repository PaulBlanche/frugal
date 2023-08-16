import { Form, Method } from "./Form.ts";
import { Navigator } from "./Navigator.ts";
import { NavigationResult, Reason } from "./Reason.ts";
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

    _shouldSubmit(): Reason | undefined {
        if (this._form.method === Method.DIALOG) {
            return Reason.DIALOG_FORM;
        }
        if (!utils.isInternalUrl(this._navigator.url)) {
            return Reason.EXTERNAL_TARGET;
        }
        if (!this._navigator.shouldVisit(this._form.directive)) {
            return Reason.NAVIGATION_DISABLED_ON_ELEMENT;
        }
    }

    async submit(): Promise<NavigationResult> {
        const reason = this._shouldSubmit();
        if (reason !== undefined) {
            return { success: false, reason };
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
