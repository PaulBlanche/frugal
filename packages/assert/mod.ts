export class AssertionError extends Error {}

export function assert(
    condition: boolean,
    message?: string,
): asserts condition {
    if (!condition) {
        throw new AssertionError(message);
    }
}
