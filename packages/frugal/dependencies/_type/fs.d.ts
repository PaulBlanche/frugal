export type WriteFileOptions = {
    append?: boolean;
    createNew?: boolean;
};

export type RemoveOptions = {
    recursive?: boolean;
};

export type CopyOptions = {
    overwrite?: boolean;
};

export type FileInfo = {
    isFile(): boolean;
    isDirectory(): boolean;
    size: number;
    mtime: Date | null;
    atime: Date | null;
    birthtime: Date | null;
};

export type DirEntry = {
    name: string;
    isFile(): boolean;
    isDirectory(): boolean;
};

export interface ServerReadableStream<T> extends ReadableStream<T> {
    values(options?: { preventCancel?: boolean }): AsyncIterableIterator<T>;
    [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}

export type WatchOptions = {
    interval?: number;
};

type FsEvent = {
    type: "any" | "create" | "modify" | "remove";
    paths: string[];
};

export interface FsWatcher extends AsyncIterable<FsEvent> {
    close(): void;
}
