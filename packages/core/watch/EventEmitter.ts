// deno-lint-ignore no-explicit-any
export type Event<TYPE extends string = any, PAYLOAD = unknown> = {
    type: TYPE;
} & PAYLOAD;

export type Listener<EVENT extends Event = Event> = (event: EVENT) => void;

export type EventNames<EVENT_MAP extends Record<string, Event>> =
    & keyof EVENT_MAP
    & string;

export type Events<EVENT_MAP extends Record<string, Event>> =
    EVENT_MAP[EventNames<EVENT_MAP>];

type ListenerConfig = {
    /** Remove the listener immediatly after the first dispatch */
    once?: boolean;
};

/**
 * Event emitter class, able to dispatch an typed event to some listeners
 */
export class EventEmitter<EVENT_MAP extends Record<string, Event>> {
    #listeners: { [K in keyof EVENT_MAP & string]: Listener<EVENT_MAP[K]>[] };

    constructor(
        listeners: {
            [K in keyof EVENT_MAP & string]: Listener<EVENT_MAP[K]>[];
        },
    ) {
        this.#listeners = listeners;
    }

    /**
     * Add a listener to a specific event. Returns a cleanup function to remove
     * the listener
     */
    addEventListener<EVENT extends keyof EVENT_MAP & string>(
        event: EVENT,
        listener: Listener<EVENT_MAP[EVENT]>,
        config: ListenerConfig = {},
    ): () => void {
        const listeners = this.#listeners[event];
        if (config.once) {
            const baseListener = listener;
            listener = (...args: Parameters<typeof listener>) => {
                baseListener(...args);
                this.removeEventListener(event, listener);
            };
        }
        if (listeners === undefined) {
            this.#listeners[event] = [listener];
        } else {
            listeners.push(listener);
        }

        return () => this.removeEventListener(event, listener);
    }

    /**
     * Remove a specific listener for a specific event
     */
    removeEventListener<EVENT extends keyof EVENT_MAP & string>(
        event: EVENT,
        listener: Listener<EVENT_MAP[EVENT]>,
    ): void {
        const listeners = this.#listeners[event];
        if (listeners !== undefined) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Dispatch the given event to all listener for this event
     */
    dispatch<EVENT extends EVENT_MAP[keyof EVENT_MAP & string]>(
        event: EVENT,
    ) {
        const listeners = this.#listeners[event.type];

        (listeners ?? []).forEach((listener) => {
            listener(event);
        });
    }
}
