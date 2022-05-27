import { type Event } from './EventEmitter.ts';

// deno-lint-ignore no-explicit-any
export type Message<TYPE extends string = any, PAYLOAD = unknown> =
    & { type: TYPE }
    & PAYLOAD;

export type MessageEvent<MESSAGE extends Message = Message> = Event<
    'message',
    { message: MESSAGE }
>;

export type LogEvent = Event<'log', { data: unknown[] }>;

export type ReadyEvent = Event<'ready'>;
