import * as preact from 'preact';

const isServer = typeof document === 'undefined';

export type Manager = {
    update(state: preact.VNode[]): void;
    instanceStack: Set<preact.VNode<any>>;
};

type SideEffectProps = {
    reduceComponentsToState: (
        components: preact.VNode<any>[],
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
            this.props.manager.instanceStack.add(this as any);
            this.emitChange();
        }
    }
    componentDidMount() {
        this.props.manager.instanceStack.add(this as any);
        this.emitChange();
    }
    componentDidUpdate() {
        this.emitChange();
    }
    componentWillUnmount() {
        this.props.manager.instanceStack.delete(this as any);
        this.emitChange();
    }

    render() {
        return null;
    }
}
