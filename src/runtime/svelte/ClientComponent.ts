// deno-lint-ignore ban-types
export type ClientComponentInstance = {};

type ClientComponentOptions = {
    target: HTMLElement;
    anchor?: HTMLElement;
    // deno-lint-ignore no-explicit-any
    props?: any;
    // deno-lint-ignore no-explicit-any
    context?: Map<string | number | symbol, any>;
    hydrate?: boolean;
    intro?: boolean;
};

export interface ClientComponent {
    new (options: ClientComponentOptions): ClientComponentInstance;
}
