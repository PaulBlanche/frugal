import { eng, removeStopwords } from "npm:stopword@2.0.8";
import { Plugin } from "$dep/frugal/mod.ts";
import { Toc } from "./pages/doc/toc.ts";

type Node<DATA> = [
    radix: string,
    children: Node<DATA>[],
    word?: string,
    data?: DATA[],
];

class Radix<DATA> {
    #node: Node<DATA>;

    static from<DATA>(serialized: Node<DATA>) {
        return new Radix(serialized);
    }

    constructor(node: Node<DATA> = ["", []]) {
        this.#node = node;
    }

    get node() {
        return this.#node;
    }

    insert(word: string, data: DATA) {
        const { node, suffix } = this.#findBestExactMatch(word);

        if (suffix.length === 0) {
            node[3] = node[3] ?? [];
            node[3].push(data);
            return;
        }

        const partialMatch = node[1].find((child) => child[0][0] === suffix[0]);
        if (partialMatch === undefined) {
            node[1].push([suffix, [], word, [data]]);
        } else {
            let i = 0;
            while (suffix[i] === partialMatch[0][i]) {
                i++;
            }
            const splitRadix1 = partialMatch[0].slice(0, i);
            const splitRadix2 = partialMatch[0].slice(i);
            const splitNode2: Node<DATA> = [splitRadix2, partialMatch[1], partialMatch[2], partialMatch[3]];
            partialMatch[0] = splitRadix1;
            partialMatch[1] = [splitNode2];
            partialMatch.splice(2, 2);
            if (suffix === splitRadix1) {
                partialMatch[2] = word;
                partialMatch[3] = [data];
            } else {
                partialMatch[1].push([suffix.slice(i), [], word, [data]]);
            }
        }
    }

    query(word: string) {
        const results: DATA[] = [];

        const { node, suffix } = this.#findBestExactMatch(word);

        const queue: Node<DATA>[] = [];

        if (suffix.length === 0) {
            queue.push(node);
        } else {
            queue.push(...node[1].filter((child) => child[0].startsWith(suffix)));
        }

        let current: Node<DATA> | undefined;
        while ((current = queue.pop()) !== undefined) {
            if (current[3]) {
                results.push(...current[3]);
            }
            queue.push(...current[1]);
        }

        return results;
    }

    serialize() {
        return this.#node;
    }

    #findBestExactMatch(word: string) {
        let node = this.#node;
        let suffix = word;
        let foundMatch = true;

        while (foundMatch) {
            foundMatch = false;
            for (const child of node[1]) {
                if (suffix.startsWith(child[0])) {
                    node = child;
                    suffix = suffix.slice(node[0].length);
                    foundMatch = true;
                    break;
                }
            }
        }

        return { node, suffix };
    }
}

type Meta = {
    version: string;
    title: string;
    slug: string;
};

type Document = Meta & {
    content: string;
};

type RadixData = [index: number, count: number];

function getWords(content: string): string[] {
    return removeStopwords(
        [...(content.match(/\b(\w+)\b/g) ?? [])].filter((word) => !word.match(/^\d+$/) && !(word.length < 3)).map(
            (word) => word.toLowerCase(),
        ),
        eng,
    );
}

export class SearchIndex {
    #radix: Radix<RadixData>;
    #meta: Meta[];

    static from(serialized: { radix: Node<RadixData>; meta: Meta[] }) {
        return new SearchIndex(Radix.from(serialized.radix), serialized.meta);
    }

    constructor(radix = new Radix<RadixData>(), meta: Meta[] = []) {
        this.#radix = radix;
        this.#meta = meta;
    }

    add({ content, title, slug, version }: Document) {
        const contentWords = getWords(content);
        const titleWords = getWords(title);

        const counts = new Map<string, number>();

        for (const word of contentWords) {
            const frequency = counts.get(word) ?? 0;
            counts.set(word, frequency + 1);
        }

        for (const word of titleWords) {
            const frequency = counts.get(word) ?? 0;
            counts.set(word, frequency + 10);
        }

        const wordCounts = Array.from(counts.entries());
        const max = Math.max(...wordCounts.map((entry) => entry[1]));

        const normalizedWordCounts = wordCounts.map((entry) => [entry[0], entry[1] / max] as [string, number]);

        const top = normalizedWordCounts.filter((entry) => entry[1] > 0.15);

        this.#meta.push({ title, slug, version });

        for (const [word, count] of top) {
            this.#radix.insert(word, [this.#meta.length - 1, count]);
        }
    }

    query(search: string) {
        const words = getWords(search).map((word) => levenstein(this.#radix, word, 3)).filter((word): word is string =>
            word !== undefined
        );

        const intersect: Record<number, { data: RadixData; count: number }> = {};
        for (const word of words) {
            const rawResults = this.#radix.query(word);
            const dedupe: Record<number, RadixData> = {};
            for (const data of rawResults) {
                const deduped = dedupe[data[0]];
                if (deduped === undefined) {
                    dedupe[data[0]] = data;
                } else if (data[1] > deduped[1]) {
                    deduped[1] = data[1];
                }
            }
            for (const data of Object.values(dedupe)) {
                intersect[data[0]] = intersect[data[0]] ?? { data, count: 0 };
                intersect[data[0]].count += 1;
            }
        }

        const results: { title: string; slug: string; score: number }[][] = [];

        for (const { data, count } of Object.values(intersect)) {
            const delta = words.length - count;
            results[delta] = results[delta] ?? [];

            const meta = this.#meta[data[0]];
            results[delta].push({
                ...meta,
                score: data[1],
            });
        }

        for (const result of results) {
            result && result.sort((a, b) => b.score - a.score);
        }

        return results;
    }

    serialize() {
        return { radix: this.#radix.serialize(), meta: this.#meta };
    }
}

type LevensteinResult = [word: string, score: number];

function levenstein(radix: Radix<unknown>, word: string, max: number): string | undefined {
    const currentRow = Array.from({ length: word.length + 1 }, (_, i) => i);
    const results: LevensteinResult[] = [];

    for (const child of radix.node[1]) {
        recursiveLevenstein(child, word, currentRow, results, max);
    }

    const exactMatch = results.find((result) => result[1] === 0);
    if (exactMatch !== undefined) {
        return exactMatch[0];
    }

    const bestMatch = results.sort((a, b) => a[1] - b[1])[0];
    if (bestMatch !== undefined) {
        return bestMatch[0];
    }

    return undefined;
}

function recursiveLevenstein(
    node: Node<unknown>,
    word: string,
    _previousRow: number[],
    results: LevensteinResult[],
    max: number,
) {
    const columns = word.length + 1;
    let previousRow = _previousRow;
    for (const letter of node[0]) {
        const currentRow = [previousRow[0] + 1];

        for (let column = 1; column < columns; column++) {
            const insertCost = currentRow[column - 1] + 1;
            const deleteCost = previousRow[column] + 1;

            let replaceCost;
            if (word[column - 1] !== letter) {
                replaceCost = previousRow[column - 1] + 1;
            } else {
                replaceCost = previousRow[column - 1];
            }

            currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
        }

        previousRow = currentRow;
    }

    const currentOptimalScore = previousRow[previousRow.length - 1];
    if (currentOptimalScore <= max && node[2] !== undefined) {
        results.push([node[2], currentOptimalScore]);
    }

    if (Math.min(...previousRow) <= max) {
        for (const child of node[1]) {
            recursiveLevenstein(child, word, previousRow, results, max);
        }
    }
}

export function search(): Plugin {
    return (frugal) => ({
        name: "index",
        setup(build) {
            build.onStart(async () => {
                const toc: Toc = JSON.parse(
                    await Deno.readTextFile(new URL("./src/contents/doc/toc.json", import.meta.url)),
                );

                const searchIndex = new SearchIndex();

                for (const [version, tocVersion] of Object.entries(toc)) {
                    await Promise.all(
                        tocVersion.entries
                            .filter((entry) => entry.file !== undefined)
                            .map(async (entry) => {
                                const content = await Deno.readTextFile(
                                    new URL(`./src/contents/doc/${entry.file}`, import.meta.url),
                                );

                                searchIndex.add({ content, title: entry.title, slug: entry.slug, version });
                            }),
                    );
                }

                await Deno.writeTextFile(
                    new URL("search-index.json", frugal.config.publicdir),
                    JSON.stringify(searchIndex.serialize()),
                );
            });
        },
    });
}
