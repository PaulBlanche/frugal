import { script } from '../../../plugins/script.ts';
import { FrugalConfig } from '../../../src/Config.ts';

export default {
    self: import.meta.url,
    pages: ['./page-bar.ts', './page-foo.ts'],
    outdir: './.temp/puppeteer/',
    log: { level: 'silent' },
    plugins: [
        script(),
    ],
} as FrugalConfig;
