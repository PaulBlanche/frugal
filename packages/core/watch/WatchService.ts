import { readLines } from 'https://deno.land/std@0.136.0/io/mod.ts';
import {
    EventEmitter,
    type EventNames,
    type Events,
    type Listener,
} from './EventEmitter.ts';
import { type Message, type MessageEvent } from './types.ts';
import { type WatchChildEvents } from './WatchChild.ts';

type EventMap<MESSAGE extends Message> = {
    message: MessageEvent<MESSAGE>;
};

export type WatchServiceEvents<MESSAGE extends Message> = Events<
    EventMap<MESSAGE>
>;

export class WatchService<
    IN_MESSAGE extends Message = Message,
    OUT_MESSAGE extends Message = Message,
> {
    #eventEmitter: EventEmitter<EventMap<IN_MESSAGE>>;

    constructor() {
        this.#eventEmitter = new EventEmitter({
            'message': [],
        });

        console.log = (...data: unknown[]) => {
            this.#sendEvent({ type: 'log', data });
        };

        this.#sendEvent({ type: 'ready' });
    }

    async #listen() {
        for await (const line of readLines(Deno.stdin)) {
            const event: WatchServiceEvents<IN_MESSAGE> = JSON.parse(line);
            this.#dispatch(event);
        }
    }

    start() {
        return this.#listen();
    }

    sendMessage(message: OUT_MESSAGE) {
        this.#sendEvent({ type: 'message', message });
    }

    #sendEvent(event: WatchChildEvents<OUT_MESSAGE>) {
        Deno.stdout.write(
            new TextEncoder().encode(JSON.stringify(event) + '\n'),
        );
    }

    addEventListener<EVENT extends EventNames<EventMap<IN_MESSAGE>>>(
        event: EVENT,
        listener: Listener<EventMap<IN_MESSAGE>[EVENT]>,
        config: { once?: boolean } = {},
    ): () => void {
        return this.#eventEmitter.addEventListener(event, listener, config);
    }

    #dispatch<EVENT extends WatchServiceEvents<IN_MESSAGE>>(
        event: EVENT,
    ) {
        this.#eventEmitter.dispatch(event);
    }
}
