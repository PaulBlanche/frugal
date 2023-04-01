export interface Context {
  dev(): Promise<void>;
  dispose(): Promise<void>;
}
