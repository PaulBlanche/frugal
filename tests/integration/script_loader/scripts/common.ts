export function log(message: string) {
    const log = document.getElementById('log')!;

    const entry = document.createElement('span');

    entry.textContent = message;

    log.appendChild(entry);
}
