import { Island, IslandProps } from 'frugal/runtime/preact.client.ts';

import { NAME } from './Counter.script.ts';
import { Counter, CounterProps } from './Counter.tsx';

type CounterIslandProps =
  & CounterProps
  & Pick<IslandProps<unknown>, 'strategy' | 'clientOnly' | 'query'>;

export function CounterIsland(
  { strategy, clientOnly, query, ...props }: CounterIslandProps,
) {
  return (
    <Island
      strategy={strategy}
      clientOnly={clientOnly}
      query={query}
      name={NAME}
      Component={Counter}
      props={props}
    />
  );
}
