import { Context } from './Context.ts';

import * as esbuild from '../../dep/esbuild.ts';

export const WATCH_MESSAGE_SYMBOL = Symbol('WATCH_MESSAGE_SYMBOL');

export class WatchContext implements Context {
  #context: esbuild.BuildContext;

  constructor(context: esbuild.BuildContext) {
    this.#context = context;
  }

  async dev() {
    const originalLog = console.log;
    console.log = (...args) => {
      if (
        typeof args[0] === 'object' && args[0] !== null &&
        WATCH_MESSAGE_SYMBOL in args[0]
      ) {
        originalLog(JSON.stringify(args[0]));
      } else {
        originalLog(...args);
      }
    };

    return await this.#context.watch();
  }

  async dispose() {
    await this.#context.dispose();
    esbuild.stop();
  }
}
