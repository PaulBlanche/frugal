import { Navigator } from "./Navigator.ts";
import * as utils from "./utils.ts";

export class Visitor {
    anchor: HTMLAnchorElement;
    _navigator: Navigator;

    constructor(
        anchor: HTMLAnchorElement,
        navigator: Navigator,
    ) {
        this._navigator = navigator;
        this.anchor = anchor;
    }

    _shouldVisit() {
        const rel = this.anchor.rel ?? "";
        const isExternal = rel.split(" ").includes("external");
        const directive = this.anchor.dataset["frugalNavigate"];

        return this._navigator.shouldVisit(directive) && !isExternal &&
            utils.isInternalUrl(this._navigator.url);
    }

    async visit(): Promise<boolean> {
        if (!this._shouldVisit()) {
            return false;
        }

        return await this._navigator.visit();
    }
}
