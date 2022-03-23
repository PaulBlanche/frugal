// basic template component
export function article(title: string, content: string) {
    return `
        <h1>${title}</h1>
        <p>${content}</p>
    `;
}
