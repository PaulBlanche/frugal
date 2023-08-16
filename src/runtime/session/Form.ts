import * as utils from "./utils.ts";

export enum EncodingType {
    URLENCODED = "application/x-www-form-urlencoded",
    MULTIPART = "multipart/form-data",
    PLAIN = "text/plain",
}

export enum Method {
    GET = "GET",
    POST = "POST",
    DIALOG = "DIALOG",
}

export class Form {
    _form: HTMLFormElement;
    _submitter?: HTMLElement | null;

    constructor(
        form: HTMLFormElement,
        submitter?: HTMLElement | null | undefined,
    ) {
        this._form = form;
        this._submitter = submitter;
    }

    submit() {
        this._form.submit();
    }

    get directive() {
        return this._form.dataset["frugalNavigate"];
    }

    get enctype() {
        return getEncType(this._form.enctype);
    }

    get url() {
        const url = utils.getUrl(
            this._submitter?.getAttribute("formaction") ??
                this._form.getAttribute("action") ?? this._form.action ?? "",
        );

        if (this.method === Method.GET) {
            url.search = formDataToUrlSearchParams(this.formData).toString();
        }

        return url;
    }

    get method() {
        const method = this._submitter?.getAttribute("formmethod") ||
            this._form.getAttribute("method") || "GET";
        return getMethod(method);
    }

    get formData() {
        const formData = new FormData(this._form);
        const submitterName = this._submitter?.getAttribute("name");
        const submitterValue = this._submitter?.getAttribute("value");

        if (typeof submitterName === "string") {
            formData.set(submitterName, submitterValue ?? "");
        }

        return formData;
    }

    get body() {
        if (this.enctype === EncodingType.URLENCODED) {
            return formDataToUrlSearchParams(this.formData);
        }

        return this.formData;
    }
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
        case Method.DIALOG: {
            return Method.DIALOG;
        }
        case Method.POST:
        default: {
            return Method.POST;
        }
    }
}

function formDataToUrlSearchParams(formData: FormData): URLSearchParams {
    const urlSearchParams = new URLSearchParams();

    for (const [name, value] of formData.entries()) {
        if (typeof value === "string") {
            urlSearchParams.set(name, value);
        }
    }

    return urlSearchParams;
}
