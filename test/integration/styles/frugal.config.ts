import { cssModule } from '../../../plugins/cssModule.ts';
import { style } from '../../../plugins/style.ts';
import { FrugalConfig } from '../../../src/Config.ts';

export default {
  self: import.meta.url,
  pages: ['./page-bar.ts', './page-foo.ts'],
  log: { level: 'silent' },
  outdir: './.temp/puppeteer/',
  plugins: [
    cssModule(),
    style(),
  ],
} as FrugalConfig;
