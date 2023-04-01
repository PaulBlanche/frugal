globalThis._log = [] as string[];

export function log(message: string) {
  globalThis._log.push(message);
}
