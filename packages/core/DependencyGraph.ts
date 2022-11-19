import * as graph from '../dependency_graph/mod.ts';
import { inOrder } from '../dependency_graph/graph.ts';
import { Asset, Loader } from './loader.ts';
import * as log from '../log/mod.ts';
import * as fs from '../../dep/std/fs.ts';
import * as path from '../../dep/std/path.ts';

function logger() {
    return log.getLogger('frugal:DependencyGraph');
}

/**
 * Class building and handling a dependency graph
 */
export class DependencyGraph {
    #graph: graph.DependencyGraph;

    /**
     * Build a dependency graph from the given entrypoint.
     */
    static async build(entrypoints: URL[], config: graph.Config) {
        return new DependencyGraph(await graph.build(entrypoints, config));
    }

    constructor(graph: graph.DependencyGraph) {
        this.#graph = graph;
    }

    /**
     * For the passed list of loaders, gather all modules in the dependency
     * graph matching at least one loader.
     *
     * If an asset matches more than one loader, the first loader in the list
     * wins.
     */
    gather(loaders: Loader<unknown>[]) {
        const gathered: Asset[] = [];

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'asset gathering',
            },
        });

        inOrder(this.#graph, (current) => {
            if (current.type === 'root') return;

            for (const loader of loaders) {
                if (loader.test(current.url)) {
                    const alreadyGathered = gathered.some((entry) =>
                        entry.loader === loader.name &&
                        entry.entrypoint === current.entrypoint.toString() &&
                        entry.module === current.url.toString()
                    );

                    if (!alreadyGathered) {
                        logger().debug({
                            op: 'gathering',
                            url: current.url.toString(),
                            loader: loader.name,
                            msg() {
                                return `loader ${this.loader} ${this.op} ${this.url}`;
                            },
                        });

                        gathered.push({
                            hash: current.moduleHash,
                            loader: loader.name,
                            entrypoint: current.entrypoint.toString(),
                            module: current.url.toString(),
                        });
                    }
                }
            }
        });

        logger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'asset gathering',
            },
        });

        return gathered;
    }

    /**
     * Build a unique module list from the dependency graph
     */
    moduleList(root: string) {
        return ModuleList.build(this.#graph, root);
    }
}

type Module = {
    moduleHash: string;
    contentHash: string;
};

/**
 * Class holding the list of all unique modules inside a dependency graph
 */
export class ModuleList {
    #modules: Record<string, Module>;
    #root: string;

    /**
     * Build the module list from a dependency graph
     */
    static build(dependencyGraph: graph.DependencyGraph, root: string) {
        const modules: Record<string, Module> = {};

        const seen = new Set<graph.Node>();
        inOrder(dependencyGraph, (node) => {
            if (node.type === 'module' && !seen.has(node)) {
                const key = path.relative(root, node.entrypoint.pathname);
                modules[key] = {
                    moduleHash: node.moduleHash,
                    contentHash: node.contentHash,
                };
            }
        });

        return new ModuleList(modules, root);
    }

    static async load(filePath: string, root: string) {
        const modules = JSON.parse(
            await Deno.readTextFile(filePath),
        );
        return new ModuleList(modules, root);
    }

    constructor(modules: Record<string, Module>, root: string) {
        this.#modules = modules;
        this.#root = root;
    }

    /**
     * Query the module info based on its URL
     */
    get(url: URL): Module | undefined {
        console.log('get', path.relative(this.#root, url.pathname));
        return this.#modules[path.relative(this.#root, url.pathname)];
    }

    async save(filePath: string) {
        const serializedData = JSON.stringify(this.#modules, null, 2);

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(filePath, serializedData);
    }
}
