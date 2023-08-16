import { TocEntry } from "../toc.ts";

export type Data = { entries: Omit<TocEntry, "file">[] };
