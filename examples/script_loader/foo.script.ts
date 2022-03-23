import { log } from './common.ts';

// each `.script.ts` file must export a `main` function. This function will be
// executed client-side
export function main() {
    log('foo');
}
