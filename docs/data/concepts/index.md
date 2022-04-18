# Concepts

Frugal is built to be composable, opposite to a monolith like Next.js.

The core of frugal is the rendering engine. This engine handle pages descriptors and orchestrate the generation process (data fetching and rendering). This engine is also responsible of the incremental rendering feature, by keeping track of what page was rendered with wich data, to skip ulterior unnecessary generations. The rendering engine is framework agnostic.

This core can be extended with loaders. Loaders are executed at build time, and produce static files. For example, CSS or client-side JS are handled via loader.
