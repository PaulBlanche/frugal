export async function rawTransformer(
    url: string,
) {
    const { default: raw } = await import(url);
    const script = `
        export default ${JSON.stringify({ url: raw.url })};
    `;

    return script;
}
