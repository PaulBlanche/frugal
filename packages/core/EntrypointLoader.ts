import * as graph from '../dependency_graph/mod.ts';
import { getPageFromDescriptor } from './Page.ts';
import { CleanConfig } from './Config.ts';
import { assert } from '../../dep/std/asserts.ts';

export class EntrypointLoader {
    private config: CleanConfig;

    constructor(config: CleanConfig) {
        this.config = config;
    }

    async load(dependencyTree: graph.DependencyTree) {
        return await Promise.all(
            this.config.entrypoints.map(async (entrypoint) => {
                const node = dependencyTree.dependencies.find((node) =>
                    String(node.url) === String(entrypoint.url)
                );
                assert(node !== undefined);

                return getPageFromDescriptor(
                    String(node.url),
                    node.moduleHash,
                    await entrypoint.getDescriptor(),
                );
            }),
        );
    }
}
