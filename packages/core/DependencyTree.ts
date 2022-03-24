import * as graph from '../dependency_graph/mod.ts';
import * as tree from '../dependency_graph/tree.ts';
import { Asset, Loader } from './loader.ts';
import * as log from '../log/mod.ts';
import * as fs from '../../dep/std/fs.ts';

function logger() {
    return log.getLogger('frugal:DependencyTree');
}

export class DependencyTree {
    private tree: graph.DependencyTree;

    static async build(entrypoints: URL[], config: graph.Config) {
        const tree = await graph.build(entrypoints, config);
        return new DependencyTree(tree);
    }

    constructor(tree: graph.DependencyTree) {
        this.tree = tree;
    }

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

        tree.inOrder(this.tree, (current) => {
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

    moduleList() {
        return ModuleList.build(this.tree);
    }
}

type Module = {
    moduleHash: string;
    contentHash: string;
    entrypoint: string;
    url: string;
    dependencies: string[];
};

export class ModuleList {
    private modules: Record<string, Module>;

    static build(dependencyTree: graph.DependencyTree) {
        const modules: Record<string, Module> = {};

        const seen = new Set<tree.Module>();
        tree.inOrder(dependencyTree, (node) => {
            if (node.type === 'module' && !seen.has(node)) {
                modules[String(node.url)] = {
                    moduleHash: node.moduleHash,
                    contentHash: node.contentHash,
                    entrypoint: String(node.entrypoint),
                    url: String(node.entrypoint),
                    dependencies: node.dependencies.map((dependency) =>
                        String(dependency.url)
                    ),
                };
            }
        });

        return new ModuleList(modules);
    }

    static async load(filePath: string) {
        const modules = JSON.parse(
            await Deno.readTextFile(filePath),
        );
        return new ModuleList(modules);
    }

    constructor(modules: Record<string, Module>) {
        this.modules = modules;
    }

    get(url: URL): Module | undefined {
        return this.modules[String(url)];
    }

    async save(filePath: string) {
        const serializedData = JSON.stringify(this.modules);

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(filePath, serializedData);
    }
}
