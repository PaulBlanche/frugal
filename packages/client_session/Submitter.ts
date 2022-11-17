import { Navigator } from './Navigator.ts';
import * as utils from './utils.ts';

enum EncodingType {
    URLENCODED = 'application/x-www-form-urlencoded',
    MULTIPART = 'multipart/form-data',
    PLAIN = 'text/plain',
}

enum Method {
    GET = 'GET',
    POST = 'POST',
}

export class Submitter {
    #form: HTMLFormElement;
    #submitter?: HTMLElement | null;
    #navigator: Navigator;

    constructor(
        form: HTMLFormElement,
        submitter: HTMLElement | null | undefined,
        navigator: Navigator,
    ) {
        this.#form = form;
        this.#submitter = submitter;
        this.#navigator = navigator;
    }

    #shouldSubmit() {
        const method = this.#method();
        const directive = this.#form.dataset['frugalNavigate'];

        return method !== 'dialog' &&
            utils.isInternalUrl(this.#navigator.url) &&
            this.#navigator.shouldVisit(directive);
    }

    async submit(): Promise<boolean> {
        if (!this.#shouldSubmit()) {
            return false;
        }

        const encType = getEncType(this.#form.enctype);
        const method = getMethod(this.#method());
        const formData = this.#formData();

        const requestInit: RequestInit = {
            method,
        };

        if (method !== Method.GET) {
            requestInit.body = encType === EncodingType.URLENCODED
                ? formDataToUrlSearchParams(formData)
                : formData;
        }

        return await this.#navigator.visit(requestInit);
    }

    #method() {
        const method = this.#submitter?.getAttribute('formmethod') ||
            this.#form.getAttribute('method') || 'GET';
        return method;
    }

    #formData() {
        const formData = new FormData(this.#form);
        const submitterName = this.#submitter?.getAttribute('name');
        const submitterValue = this.#submitter?.getAttribute('value');

        if (typeof submitterName === 'string') {
            formData.set(submitterName, submitterValue ?? '');
        }

        return formData;
    }
}

function formDataToUrlSearchParams(formData: FormData): URLSearchParams {
    const urlSearchParams = new URLSearchParams();

    for (const [name, value] of formData.entries()) {
        if (typeof value === 'string') {
            urlSearchParams.set(name, value);
        }
    }

    return urlSearchParams;
}

function getEncType(enctype: string): EncodingType {
    switch (enctype) {
        case EncodingType.MULTIPART: {
            return EncodingType.MULTIPART;
        }
        case EncodingType.PLAIN: {
            return EncodingType.PLAIN;
        }
        default: {
            return EncodingType.URLENCODED;
        }
    }
}

function getMethod(method: string): Method {
    switch (method.toUpperCase()) {
        case Method.GET: {
            return Method.GET;
        }
        case Method.POST:
        default: {
            return Method.POST;
        }
    }
}
