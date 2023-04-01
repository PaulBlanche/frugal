import { Navigator } from './Navigator.ts';
import { NavigatorConfig } from './Navigator.ts';

const HISTORY_INSTANCE = `$$frugal$$history$$instance$$`;

declare global {
  interface Window {
    [HISTORY_INSTANCE]?: SessionHistory;
  }

  interface WindowEventMap {
    'frugal:popstate': CustomEvent<{ navigator: Navigator }>;
  }
}

export class SessionHistory {
  #stack: Navigator[];
  #index: number;
  #observing: boolean;
  #config: NavigatorConfig;

  static create(config: NavigatorConfig) {
    if (window[HISTORY_INSTANCE] !== undefined) {
      throw Error(
        'A SessionHistory instance was already created',
      );
    }

    window[HISTORY_INSTANCE] = new SessionHistory(config);

    return window[HISTORY_INSTANCE];
  }

  static getInstance() {
    if (window[HISTORY_INSTANCE] === undefined) {
      throw Error(
        'You need to create a SessionHistory first',
      );
    }

    return window[HISTORY_INSTANCE];
  }

  private constructor(config: NavigatorConfig) {
    this.#config = config;
    this.#stack = [new Navigator(new URL(location.href), this.#config)];
    this.#index = 0;
    this.#observing = false;
  }

  observe() {
    if (this.#observing) {
      return;
    }
    this.#observing = true;

    addEventListener('popstate', (event) => {
      event.preventDefault();

      const previous = this.#stack[this.#index];
      previous.saveScroll();

      this.#index = event.state ?? 0;
      const current = this.#stack[this.#index];
      current.shouldRestoreScroll();

      dispatchEvent(
        new CustomEvent('frugal:popstate', {
          detail: { navigator: current },
        }),
      );
    });
  }

  saveScroll() {
    const current = this.#stack[this.#index];
    current.saveScroll();
  }

  push(navigator: Navigator) {
    this.#stack = this.#stack.slice(0, this.#index + 1);
    this.#stack.push(navigator);
    this.#index += 1;
    history.pushState(this.#index, '', navigator.url);
  }

  back() {
    history.back();
  }

  forward() {
    history.forward();
  }

  go(delta?: number) {
    history.go(delta);
  }
}
