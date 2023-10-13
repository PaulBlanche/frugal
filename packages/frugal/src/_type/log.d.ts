import { LEVELS } from "../log.js";

export type Level = keyof typeof LEVELS;

export type LogEntry = {
    level: Exclude<Level, "silent">;
    scope: string;
    extra: string;
};

export type LogConfig = {
    level: Level;
    scopes: Record<string, Level | undefined>;
};

export type Log = (messageOrError: string | Error, entry?: Partial<LogEntry>) => void;
