export async function main() {
    const { log } = await import('./common.ts');
    log('baz');
}
