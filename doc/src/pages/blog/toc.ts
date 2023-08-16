export type TocEntry = {
    slug: string;
    title: string;
    headline: string;
    date: string;
    file: string;
    splash: string;
};

export type Toc = TocEntry[];

export type TocHierarchy = {
    segment: string;
    entry: TocEntry;
    children: Record<string, TocHierarchy>;
};

let TOC_PROMISE: Promise<string>;

export async function getToc(resolve: (path: string) => string): Promise<Toc> {
    if (TOC_PROMISE === undefined) {
        TOC_PROMISE = Deno.readTextFile(resolve(`./src/contents/blog/toc.json`));
    }

    const tocContent = await TOC_PROMISE;
    return JSON.parse(tocContent);
}
