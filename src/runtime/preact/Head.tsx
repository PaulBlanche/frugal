/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import * as hooks from 'preact/hooks';
import * as effect from './Effect.ts';

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
        update: (state) => {
          props.onHeadUpdate(state);
          if (typeof document !== 'undefined') {
            updateClient(state);
          }
        },
        instanceStack: new Set(),
      }}
    >
      {props.children}
    </headManagerContext.Provider>
  );
}

function updateClient(state: preact.VNode[]) {
  const htmls = state.filter((node) => node.type === 'html');
  const head = state.filter((node) => node.type !== 'html');

  const htmlProps = {};

  for (const html of htmls) {
    Object.assign(htmlProps, html.props);
  }

  for (const [key, value] of Object.entries(htmlProps)) {
    document.querySelector('html')?.setAttribute(key, String(value));
  }

  preact.render(head, document.head);
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
  effects: effect.Effect[],
) {
  return effects
    .reduce<preact.ComponentChild[]>((allChilren, effect) => {
      const effectChildren = effect.props.children;
      return allChilren.concat(effectChildren);
    }, []).reduce<preact.VNode[]>((list, node) => {
      if (preact.isValidElement(node)) {
        return list.concat(node);
      }
      return list;
    }, [])
    .reverse()
    .filter(unique())
    .reverse()
    .map((node, i) => {
      const key = node.key ?? (i + 1);
      return preact.cloneElement(node, { key });
    });
}

const METATYPES = ['name', 'httpEquiv', 'charSet', 'itemProp'];

function unique() {
  const tags = new Set();
  const metaTypes = new Set();
  const metaCategories: { [metatype: string]: Set<string> } = {};

  // any because it can be any node with any props
  // deno-lint-ignore no-explicit-any
  return (node: preact.VNode<any>) => {
    switch (node.type) {
      case 'title':
      case 'base':
        if (tags.has(node.type)) {
          return false;
        }

        tags.add(node.type);
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

          if (metatype === 'charSet') {
            if (metaTypes.has(metatype)) {
              return false;
            }
            metaTypes.add(metatype);
          } else {
            const category = node.props[metatype];
            const categories = metaCategories[metatype] ??
              new Set();

            if (metatype !== 'name' && categories.has(category)) {
              return false;
            }

            categories.add(category);
            metaCategories[metatype] = categories;
          }
        }
        break;
    }

    return true;
  };
}
