import { type Event } from './EventEmitter.ts';

export type Message<TYPE extends string = any, PAYLOAD = unknown> =
    & { type: TYPE }
    & PAYLOAD;

export type MessageEvent<MESSAGE extends Message = Message> = Event<
    'message',
    { message: MESSAGE }
>;

export type LogEvent = Event<'log', { data: any[] }>;

export type ReadyEvent = Event<'ready'>;
