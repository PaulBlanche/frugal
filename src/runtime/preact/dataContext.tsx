/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import * as hooks from 'preact/hooks';
import './types.ts';

import { Head } from './Head.tsx';

type DataContext = { data: unknown; pathname: string };

const dataContext = preact.createContext<DataContext | undefined | null>(
  undefined,
);

export function useData<DATA>(): DATA {
  const context = hooks.useContext(dataContext);
  if (context === null || context === undefined) {
    throw Error('wrap in DataProvider');
  }

  return context.data as DATA;
}

export function usePathname(): string {
  const context = hooks.useContext(dataContext);
  if (context === null || context === undefined) {
    throw Error('wrap in DataProvider');
  }

  return context.pathname;
}

type DataProviderProps = {
  embedData?: boolean;
  context?: DataContext;
  children: preact.ComponentChildren;
};

export function DataProvider(
  { embedData = false, context, children }: DataProviderProps,
) {
  // server side we inject the serialized context in a script and wrap
  // the tree in a `dataContext.Provider` to forward data.
  if (typeof document === 'undefined') {
    const script = `window.__FRUGAL__ = ${JSON.stringify({ context })};`
      // needed because the context might contain html that could
      // accidentaly close the script early
      .replace(
        /<\/script>/g,
        '<\\/script>',
      );
    return (
      <>
        <Head>
          {context && embedData && (
            <script dangerouslySetInnerHTML={{ __html: script }} />
          )}
        </Head>
        <dataContext.Provider value={context}>
          {children}
        </dataContext.Provider>
      </>
    );
  }

  // client side we pick the context that was injected server side and wrap
  // the tree in a `dataContext.Provider` to forward data.
  return (
    <dataContext.Provider value={window.__FRUGAL__.context}>
      {children}
    </dataContext.Provider>
  );
}
