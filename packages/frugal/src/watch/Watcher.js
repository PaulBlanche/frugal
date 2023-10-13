import * as _type from "./_type/Watcher.js";
export * from "./_type/Watcher.js";

import * as path from "../../dependencies/path.js";
import * as fs from "../../dependencies/fs.js";
import * as _process from "../../dependencies/process.js";
import * as lexer from "../../dependencies/es-lexer.js";

export class Watcher {
    /** @type {string} */
    #entrypoint;
    /** @type {Omit<_process.ChildProcessOptions, "args">} */
    #options;
    /** @type {_process.ChildProcess | undefined} */
    #childProcess;

    /**
     * @param {string} entrypoint
     * @param {Omit<_process.ChildProcessOptions, "args">} options
     */
    constructor(entrypoint, options) {
        this.#entrypoint = entrypoint;
        this.#options = options;
    }

    async spawn() {
        const watcher = fs.watch(dependencies(this.#entrypoint), { interval: 300 });

        this.#childProcess = _process.spawn(this.#entrypoint, {
            ...this.#options,
        });

        this.#listenFsEvents(watcher);

        return this.#childProcess;
    }

    /** @param {fs.FsWatcher} watcher */
    async #listenFsEvents(watcher) {
        for await (const event of watcher) {
            if (event.type === "modify") {
                watcher.close();
                break;
            }
        }

        this.#onChange();
    }

    async #onChange() {
        const watcher = fs.watch(dependencies(this.#entrypoint), { interval: 300 });

        this.#childProcess?.restart();

        this.#listenFsEvents(watcher);
    }
}

/**
 * @param {string} path
 * @returns {string[]}
 */
function dependencies(path) {
    const analyzer = new DependencyAnalyzer(path);
    return analyzer.dependencies;
}

class DependencyAnalyzer {
    /** @type {Map<string, _type.Node>} */
    #nodes;

    /** @param {string} path */
    constructor(path) {
        this.#nodes = new Map();
        this.#walk(path);
    }

    get dependencies() {
        return [...this.#nodes.keys()];
    }

    /** @param {string} filePath */
    async #walk(filePath) {
        if (!this.#nodes.has(filePath)) {
            this.#nodes.set(filePath, { filePath, importCount: 1, parsed: false, children: {} });
        }
        const node = /** @type {_type.Node} */ (this.#nodes.get(filePath));

        const queue = [node];

        /** @type {_type.Node | undefined} */
        let current = undefined;
        while ((current = queue.pop()) !== undefined) {
            if (current.parsed && this.#nodes.has(current.filePath)) {
                continue;
            }

            const dependencies = await this.#parse(current.filePath);
            current.parsed = true;

            for (const dependency of dependencies) {
                if (!this.#nodes.has(dependency)) {
                    this.#nodes.set(dependency, {
                        filePath: dependency,
                        parsed: false,
                        importCount: 0,
                        children: {},
                    });
                }
                const node = /** @type {_type.Node} */ (this.#nodes.get(dependency));

                if (!(dependency in current.children)) {
                    node.importCount += 1;
                    current.children[dependency] = true;
                    queue.push(node);
                }
            }
        }
    }

    /**
     * @param {string} filePath
     * @returns {Promise<string[]>}
     */
    async #parse(filePath) {
        const imports = await lexer.parse(await fs.readTextFile(filePath));

        return imports
            .map((specifier) => {
                if (specifier.startsWith("/")) {
                    return specifier;
                }
                if (specifier.startsWith(".")) {
                    return path.resolve(path.dirname(filePath), specifier);
                }
            })
            .filter(/** @returns {specifier is string} */ (specifier) => specifier !== undefined);
    }
}
