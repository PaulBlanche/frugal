# frugal

You will need deno in order to run this project (i'm currently using deno
1.17.1, but it might work on other versions ?)

## Code organisation

- `packages/core` : frugal core, where pages are rendered if needed, where
  assets are collected and generated.

- `packages/dependency_graph` : module to produce a dependency graph given some
  entrypoints. Used to collect assets and pages.

- `packages/frugal_preact` : give frugal the ability to render pages with
  preact.

- `packages/loader_*` : loaders for different categories of assets (svg,
  scripts, styles).

Others modules are util modules (hashing, logging, assertions).

## Examples

Run `chmod +x ./Taskfile`, then run `./Taskfile example [folder]`, where
`[folder]` is any top level folder in the `./examples` folder. Running
`./Taskfil example preact` will run the `./examples/preact` folder.
