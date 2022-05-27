import * as preact from 'preact';

const isServer = typeof document === 'undefined';

export type Manager = {
    update(state: preact.VNode[]): void;
    instanceStack: Set<preact.VNode<unknown>>;
};

type SideEffectProps = {
    reduceComponentsToState: (
        components: preact.VNode<unknown>[],
    ) => preact.VNode[];
    manager: Manager;
};

export class Effect extends preact.Component<SideEffectProps> {
    emitChange = (): void => {
        this.props.manager.update(
            this.props.reduceComponentsToState(
                [...this.props.manager.instanceStack],
            ),
        );
    };

    constructor(props: SideEffectProps) {
        super(props);

        if (isServer) {
            this.#pushToStack();
            this.emitChange();
        }
    }
    componentDidMount() {
        this.#pushToStack();
        this.emitChange();
    }
    componentDidUpdate() {
        this.emitChange();
    }
    componentWillUnmount() {
        this.#popFromStack();
        this.emitChange();
    }

    render() {
        return null;
    }

    #pushToStack() {
        // deno-lint-ignore no-explicit-any
        this.props.manager.instanceStack.add(this as any);
    }

    #popFromStack() {
        // deno-lint-ignore no-explicit-any
        this.props.manager.instanceStack.delete(this as any);
    }
}
