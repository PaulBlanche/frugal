import * as frugal from 'frugal/mod.ts';
import { cssModule } from 'frugal/plugins/cssModule.ts';
import { style } from 'frugal/plugins/style.ts';
import { script } from 'frugal/plugins/script.ts';

export default {
  pages: ['./src/home.ts'],
  self: import.meta.url,
  importMap: './import_map.json',
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
    splitting: true,
  },
  plugins: [cssModule(), style(), script()],
} satisfies frugal.FrugalConfig;
