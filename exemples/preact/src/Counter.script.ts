import { hydrate } from 'frugal/runtime/preact.client.ts';

export const NAME = 'Counter';

if (import.meta.main) {
  hydrate('Counter', async () => (await import('./Counter.tsx')).Counter);
}
