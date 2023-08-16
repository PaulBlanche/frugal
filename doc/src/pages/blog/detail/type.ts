import { TocEntry } from "./toc.ts";

export type Data = Omit<TocEntry, "file"> & {
    markdown: string;
};
