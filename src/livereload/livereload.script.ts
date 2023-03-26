import { LiveReloadClient } from './LiveReloadClient.ts';

if (import.meta.main) {
    new LiveReloadClient('http://0.0.0.0:4075');
}
