export interface Persistence {
  set(key: string | [string, string], content: string): Promise<void>;
  get(key: string | [string, string]): Promise<string | undefined>;
  delete(key: string | [string, string]): Promise<void>;
}
