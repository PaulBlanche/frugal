import { script } from 'frugal/plugins/script.ts';
import { style } from 'frugal/plugins/style.ts';
import { svg } from 'frugal/plugins/svg.ts';
import { cssModule } from 'frugal/plugins/cssModule.ts';
import { FrugalConfig, importKey } from 'frugal/mod.ts';
import { UpstashPersistence } from 'frugal/persistence.ts';

const CRYPTO_KEY = Deno.env.get('CRYPTO_KEY');
const PERSISTENCE = Deno.env.get('PERSISTENCE');

export default {
  self: import.meta.url,
  outdir: './dist/',
  pages: ['./src/pages/home/mod.ts'],
  importMap: './import_map.json',
  log: {
    level: 'verbose',
  },
  nodeModuleDir: './node_modules/',
  plugins: [
    cssModule({}),
    svg({}),
    script({}),
    style({}),
  ],
  esbuild: {
    minify: true,
  },
  budget: {
    speed: 6 * 1000 * 1000,
    delay: 1,
  },
  runtimePersistence: PERSISTENCE === 'filesystem'
    ? undefined
    : new UpstashPersistence(
      Deno.env.get('UPSTASH_URL') ?? '',
      Deno.env.get('UPSTASH_TOKEN') ?? '',
    ),
  server: {
    port: 8000,
    session: CRYPTO_KEY
      ? {
        key: await importKey(CRYPTO_KEY),
      }
      : undefined,
  },
} as FrugalConfig;
