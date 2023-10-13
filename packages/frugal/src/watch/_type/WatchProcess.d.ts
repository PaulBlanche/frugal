export type EventType = "suspend" | "reload";

export type Listener = (type: EventType) => void;

export type WatchOptions = {
    port?: number;
};
