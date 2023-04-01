import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as streams from '../../dep/std/streams.ts';

import { Config } from '../Config.ts';
import { log } from '../log.ts';

type EventType = 'suspend' | 'reload' | 'ready';

export class WatchProcess {
  #config: Config;
  #command?: Deno.Command;
  #watcher: Deno.FsWatcher;
  #process?: Deno.ChildProcess;
  #listeners: ((type: EventType) => void)[];

  constructor(config: Config) {
    this.#config = config;
    this.#watcher = Deno.watchFs(path.fromFileUrl(config.self));
    this.#listeners = [];
  }

  async #setup() {
    const frugal = new URL('../Frugal.ts', import.meta.url);
    const script = `
import * as frugal from "${frugal}";
import config from "${this.#config.self.href}";
(await frugal.dev(config)).start()
`;
    const watchScriptURL = new URL('./watch.ts', this.#config.cachedir);
    await fs.ensureFile(watchScriptURL);
    await Deno.writeTextFile(watchScriptURL, script);
    this.#command = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '-A',
        '--unstable',
        watchScriptURL.href,
      ],
      env: {
        'FRUGAL_MODE': 'dev',
      },
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped',
    });
  }

  addEventListener(
    listener: (type: EventType) => void,
  ) {
    this.#listeners.push(listener);
  }

  async spawn() {
    await this.#setup();
    this.#restart();

    let timeoutId: number | undefined = undefined;
    for await (const event of this.#watcher) {
      log(`"${event.kind}" fs event on config file`, {
        scope: 'WatchProcess',
        kind: 'debug',
      });

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.#restart();
      }, 200);
    }
  }

  kill() {
    this.#process?.kill('SIGINT');
    this.#process = undefined;
  }

  #restart() {
    if (this.#process !== undefined) {
      log('watch process restarted', { scope: 'WatchProcess' });

      this.#process.kill('SIGINT');
      this.#process = undefined;
    } else {
      log('watch process started', { scope: 'WatchProcess' });
    }

    this.#process = this.#command!.spawn();
    const pid = this.#process.pid;
    this.#process.status.then(() => {
      if (this.#process?.pid === pid) {
        this.#process = undefined;
      }
    });
    this.#listenProcess(this.#process);
  }

  async #listenProcess(process: Deno.ChildProcess) {
    const lines = streams.mergeReadableStreams(
      process.stdout,
      process.stderr,
    )
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new streams.TextLineStream());

    let firstEndBuild = true;
    for await (const line of lines) {
      const trimedLine = line.trim();
      if (trimedLine.length === 0) {
        continue;
      }

      try {
        const data = JSON.parse(trimedLine);
        switch (data.type) {
          case 'start-build': {
            this.#listeners.forEach((listener) => listener('suspend'));
            break;
          }
          case 'end-build': {
            if (firstEndBuild) {
              this.#listeners.forEach((listener) => {
                listener('ready');
              });
              firstEndBuild = false;
            } else {
              this.#listeners.forEach((listener) => {
                listener('reload');
              });
            }
            break;
          }
          default:
            console.log(line);
        }
      } catch {
        console.log(line);
      }
    }
  }
}
