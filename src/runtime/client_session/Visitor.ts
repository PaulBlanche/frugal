import { Navigator } from './Navigator.ts';
import * as utils from './utils.ts';

export class Visitor {
  anchor: HTMLAnchorElement;
  #navigator: Navigator;

  constructor(
    anchor: HTMLAnchorElement,
    navigator: Navigator,
  ) {
    this.#navigator = navigator;
    this.anchor = anchor;
  }

  #shouldVisit() {
    const rel = this.anchor.rel ?? '';
    const isExternal = rel.split(' ').includes('external');
    const directive = this.anchor.dataset['frugalNavigate'];

    return this.#navigator.shouldVisit(directive) && !isExternal &&
      utils.isInternalUrl(this.#navigator.url);
  }

  async visit(): Promise<boolean> {
    if (!this.#shouldVisit()) {
      return false;
    }

    return await this.#navigator.visit();
  }
}
