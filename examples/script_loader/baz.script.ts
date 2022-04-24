// each `.script.ts` file must export a `main` function. This function will be
// executed client-side
export async function main() {
    const { log } = await import('./common.ts');
    log('baz');
}
