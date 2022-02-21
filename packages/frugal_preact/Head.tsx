/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import * as hooks from 'preact/hooks';
import * as effect from './Effect.tsx';

const headManagerContext = preact.createContext<effect.Manager | undefined>(
    undefined,
);

type HeadProviderProps = {
    onHeadUpdate: (head: preact.VNode[]) => void;
    children: preact.ComponentChildren;
};

export function HeadProvider(props: HeadProviderProps) {
    return (
        <headManagerContext.Provider
            value={{
                update: props.onHeadUpdate,
                instanceStack: new Set(),
            }}
        >
            <Head>
                <meta charSet='utf-8' />
            </Head>
            {props.children}
        </headManagerContext.Provider>
    );
}

type HeadProps = {
    children: preact.ComponentChildren;
};

export function Head({ children }: HeadProps) {
    const manager = hooks.useContext(headManagerContext);

    if (manager === undefined) {
        throw Error('no head manager found');
    }

    return (
        <effect.Effect
            reduceComponentsToState={reduceComponents}
            manager={manager}
        >
            {children}
        </effect.Effect>
    );
}

function reduceComponents(
    effects: preact.VNode[],
) {
    return effects
        .reduce<preact.ComponentChild[]>((list, effect) => {
            const effectChildren = effect.props.children;
            return list.concat(effectChildren);
        }, []).reduce<preact.VNode[]>((list, node) => {
            if (preact.isValidElement(node)) {
                return list.concat(node);
            }
            return list;
        }, [])
        .reverse()
        .filter(unique())
        .map((node, i) => {
            const key = node.key ?? i;
            return preact.cloneElement(node, { key });
        });
}

const METATYPES = ['name', 'httpEquiv', 'charSet', 'itemProp'];

function unique() {
    const tags = new Set();
    const metaTypes = new Set();
    const metaCategories: { [metatype: string]: Set<string> } = {};

    return (node: preact.VNode<any>) => {
        let isUnique = true;

        switch (node.type) {
            case 'title':
            case 'base':
                if (tags.has(node.type)) {
                    isUnique = false;
                } else {
                    tags.add(node.type);
                }
                break;
            case 'meta':
                for (let i = 0, len = METATYPES.length; i < len; i++) {
                    const metatype = METATYPES[i];
                    if (
                        !Object.prototype.hasOwnProperty.call(
                            node.props,
                            metatype,
                        )
                    ) {
                        continue;
                    }

                    if (metatype === 'charset') {
                        if (metaTypes.has(metatype)) {
                            isUnique = false;
                        } else {
                            metaTypes.add(metatype);
                        }
                    } else {
                        const category = node.props[metatype];
                        const categories = metaCategories[metatype] ||
                            new Set();
                        if (metatype !== 'name' && categories.has(category)) {
                            isUnique = false;
                        } else {
                            categories.add(category);
                            metaCategories[metatype] = categories;
                        }
                    }
                }
                break;
        }

        return isUnique;
    };
}
