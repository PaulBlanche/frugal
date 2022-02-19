import { Asset, Loader } from './loader.ts';

import * as tree from '../dependency_graph/tree.ts';
import * as log from '../log/mod.ts';

function logger() {
    return log.getLogger('frugal:asset');
}

export function gather(
    root: tree.Root,
    loaders: Loader<unknown>[],
): Asset[] {
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

    tree.inOrder(root, (current) => {
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
            return `${this.logger!.timerStart} ${this.op}`;
        },
        logger: {
            timerStart: 'asset gathering',
        },
    });

    return gathered;
}
