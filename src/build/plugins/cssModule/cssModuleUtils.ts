export function flatten(
    array: (string | undefined)[],
    moduleName: string,
    name: string,
): string {
    return array.map((item) => {
        if (item === undefined) {
            throw Error(
                `class "${name}" composes a class that does not exists in "${moduleName}"`,
            );
        }
        return item;
    }).join(' ');
}

export function wrap(names: Record<string, string>, moduleName: string) {
    return new Proxy(names, {
        get(target, prop) {
            const value = (target as any)[prop];
            if (value === undefined && typeof prop === 'string') {
                throw Error(
                    'name "' + prop + '" does not exist in "' + moduleName +
                        '"',
                );
            }
            return value;
        },
    });
}
