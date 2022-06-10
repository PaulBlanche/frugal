import { readLines } from '../../../dep/std/io.ts';
import { readerFromStreamReader } from '../../../dep/std/streams.ts';
import {
    EventEmitter,
    type EventNames,
    type Events,
    type Listener,
} from './EventEmitter.ts';
import {
    type LogEvent,
    type Message,
    type MessageEvent,
    type ReadyEvent,
} from './types.ts';
import { WatchServiceEvents } from './WatchService.ts';

type Child = Deno.Child<{
    cmd: string[];
    stderr: 'piped';
    stdout: 'piped';
    stdin: 'piped';
}>;

type WatchChildConfig = Omit<
    Deno.SpawnOptions,
    'stdin' | 'stdout' | 'stderr'
>;

type EventMap<MESSAGE extends Message> = {
    'message': MessageEvent<MESSAGE>;
    'ready': ReadyEvent;
    'log': LogEvent;
};

export type WatchChildEvents<MESSAGE extends Message> = Events<
    EventMap<MESSAGE>
>;

/**
 * Spawn a child process, listen for messages in stdout/stderr and dispatches
 * messages to stdin.
 */
export class WatchChild<
    IN_MESSAGE extends Message,
    OUT_MESSAGE extends Message,
> {
    #eventEmitter: EventEmitter<EventMap<IN_MESSAGE>>;
    #child: Child | undefined;
    #config: WatchChildConfig;
    #cmd: string | URL;

    constructor(cmd: string | URL, config: WatchChildConfig) {
        this.#eventEmitter = new EventEmitter({
            'message': [],
            'ready': [],
            'log': [],
        });
        this.#child = undefined;
        this.#config = config;
        this.#cmd = cmd;
    }

    /**
     * Spawn the child process and start listening for messages
     */
    start() {
        this.#child = Deno.spawnChild(this.#cmd, {
            ...this.#config,
            stderr: 'piped',
            stdin: 'piped',
            stdout: 'piped',
        });

        return Promise.all([this.#listenStderr(), this.#listenStdout()]);
    }

    /**
     * Stop the chils process (with SIGTERM)
     */
    stop() {
        if (this.#child === undefined) return;

        this.#child.kill('SIGTERM');
    }

    async #listenStdout() {
        if (this.#child === undefined) return;

        const reader = readerFromStreamReader(this.#child.stdout.getReader());
        for await (const line of readLines(reader)) {
            const event: WatchChildEvents<IN_MESSAGE> = JSON.parse(line);
            this.#dispatch(event);
        }
    }

    async #listenStderr() {
        if (this.#child === undefined) return;

        const reader = readerFromStreamReader(this.#child.stderr.getReader());
        for await (const line of readLines(reader)) {
            this.#dispatch({ type: 'log', data: [line] });
        }
    }

    /**
     * Send a message to the child process (as a json piped in stdin)
     */
    sendMessage(message: OUT_MESSAGE) {
        this.#sendEvent({ type: 'message', message });
    }

    #sendEvent(event: WatchServiceEvents<OUT_MESSAGE>) {
        if (this.#child === undefined) return;

        this.#child.stdin.getWriter().write(
            new TextEncoder().encode(JSON.stringify(event) + '\n'),
        );
    }

    /**
     * Listen to messages from the child process (as json piped in stdout/stderr)
     */
    addEventListener<EVENT extends EventNames<EventMap<IN_MESSAGE>>>(
        event: EVENT,
        listener: Listener<EventMap<IN_MESSAGE>[EVENT]>,
        config: { once?: boolean } = {},
    ): () => void {
        return this.#eventEmitter.addEventListener(event, listener, config);
    }

    #dispatch<EVENT extends WatchChildEvents<IN_MESSAGE>>(
        event: EVENT,
    ) {
        this.#eventEmitter.dispatch(event);
    }
}
