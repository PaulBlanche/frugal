import { Asset, Loader } from "./loader.ts";

import * as tree from "../dependency_graph/tree.ts";

export function gather(
  root: tree.Root,
  loaders: Loader<unknown>[],
): Asset[] {
  const gathered: Asset[] = [];

  tree.inOrder(root, (current) => {
    if (current.type === "root") return;


    for (const loader of loaders) {
      if (loader.test(current.url)) {
        const alreadyGathered = gathered.some((entry) =>
          entry.loader === loader.name &&
          entry.entrypoint === current.entrypoint.toString() &&
          entry.module === current.url.toString()
        );

        if (!alreadyGathered) {
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

  return gathered;
}
