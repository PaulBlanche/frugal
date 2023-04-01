import { Config } from '../Config.ts';
import { LiveReloadServer } from '../livereload/LiveReloadServer.ts';
import { log } from '../log.ts';
import * as server from '../server/mod.ts';
import { WatchProcess } from './WatchProcess.ts';
import { Context } from './Context.ts';

export class FrugalContext implements Context {
  #config: Config;
  #watchProcess: WatchProcess;
  #liveReloadServer: LiveReloadServer;
  #loadServer: () => Promise<server.Server>;
  #server?: server.Server;
  #serverController: AbortController;
  #liveReloadController: AbortController;

  constructor(config: Config, loadServer: () => Promise<server.Server>) {
    this.#config = config;
    this.#watchProcess = new WatchProcess(this.#config);
    this.#liveReloadServer = new LiveReloadServer();

    this.#watchProcess.addEventListener((type) => {
      if (type !== 'ready') {
        this.#liveReloadServer.dispatch({ type });
      }
    });

    this.#serverController = new AbortController();
    this.#liveReloadController = new AbortController();

    this.#loadServer = loadServer;
  }

  async #serve() {
    this.#serverController = new AbortController();
    this.#server = await this.#loadServer();
    this.#server.serve({
      signal: this.#serverController.signal,
      onListen: () => {
        this.#liveReloadServer.dispatch({ type: 'reload' });
      },
    });
  }

  async dev() {
    log(
      'Starting a frugal watch process, use this only for development!',
      {
        scope: 'FrugalContext',
        kind: 'warning',
      },
    );
    this.#config.budget.logBudget();

    this.#watchProcess.addEventListener((type) => {
      switch (type) {
        case 'reload':
        case 'ready': {
          this.#serve();
          break;
        }
        case 'suspend': {
          this.#serverController.abort();
          break;
        }
      }
    });

    await Promise.all([
      this.#liveReloadServer.serve({
        signal: this.#liveReloadController.signal,
      }),
      this.#watchProcess.spawn(),
    ]);
  }

  dispose() {
    this.#liveReloadController.abort();
    this.#serverController.abort();
    this.#watchProcess.kill();
    return Promise.resolve();
  }
}
