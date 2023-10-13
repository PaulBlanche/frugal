/**
 * @param {string[]} classNames
 * @returns
 */
export function format(...classNames) {
    const list = classNames.flatMap((name) => name.split(" "));
    return [...new Set(list)].join(" ");
}
