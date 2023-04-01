import { Head, PageProps } from 'frugal/runtime/preact.server.ts';

import './style.css';
import { Counter } from './Counter.tsx';
import { CounterIsland } from './Counter.island.tsx';

export function HomePage({ descriptor, assets }: PageProps) {
  const styleHref = assets['style']?.[descriptor];
  const scriptSrc = assets['script']?.[descriptor];
  return (
    <>
      <Head>
        <html lang='en' />
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width' />
        <meta name='generator' content='frugal' />
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
        {styleHref && <link rel='stylesheet' href={styleHref} />}
        {scriptSrc && <script type='module' src={scriptSrc} />}
      </Head>
      <main>
        <Counter>This counter is static</Counter>
        <CounterIsland>
          This counter is an island hydrated on load
        </CounterIsland>
        <div class='scroll-padder'>scroll to the bottom of the page...</div>
        <CounterIsland strategy='visible'>
          This counter is another island sharing its state with the first
          island, hydrated when visible
        </CounterIsland>
      </main>
    </>
  );
}
