import { Navigator } from "./Navigator.ts";
import { NavigationResult, Reason } from "./Reason.ts";

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

    _shouldVisit(): Reason | undefined {
        const rel = this.anchor.rel ?? "";
        const isExternal = rel.split(" ").includes("external");
        const directive = this.anchor.dataset["frugalNavigate"];

        if (!this._navigator.shouldVisit(directive)) {
            return Reason.NAVIGATION_DISABLED_ON_ELEMENT;
        }

        if (isExternal) {
            return Reason.EXTERNAL_TARGET;
        }
    }

    async visit(): Promise<NavigationResult> {
        const reason = this._shouldVisit();

        if (reason !== undefined) {
            return { success: false, reason };
        }

        return await this._navigator.visit();
    }
}
