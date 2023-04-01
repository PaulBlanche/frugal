import * as frugal from 'frugal/mod.ts';
import { svelte } from 'frugal/plugins/svelte.ts';
import { style } from 'frugal/plugins/style.ts';
import { script } from 'frugal/plugins/script.ts';

import globalStyle from 'svelte-preprocess/dist/processors/globalStyle';

export default {
  pages: ['./src/home.ts'],
  self: import.meta.url,
  importMap: './import_map.json',
  plugins: [
    svelte({
      preprocess: globalStyle(),
    }),
    script(),
    style(),
  ],
  log: {
    level: 'verbose',
  },
  esbuild: {
    splitting: true,
  },
} satisfies frugal.FrugalConfig;
