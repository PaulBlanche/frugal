export type ClientComponentInstance = {};

type ClientComponentOptions = {
  target: HTMLElement;
  anchor?: HTMLElement;
  props?: any;
  context?: Map<string | number | symbol, any>;
  hydrate?: boolean;
  intro?: boolean;
};

export interface ClientComponent {
  new (options: ClientComponentOptions): ClientComponentInstance;
}
