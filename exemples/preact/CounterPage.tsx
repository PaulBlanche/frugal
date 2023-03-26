/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from '../../runtime/preact.server.ts';
import { CounterIsland } from './Counter.island.tsx';

import './session.script.ts';

export function CounterPage({ assets, descriptor }: preact.PageProps) {
    const scriptSrc = assets['script'][descriptor];
    return (
        <div>
            <preact.Head>
                <title>counter</title>
                {scriptSrc && <script type='module' src={scriptSrc}></script>}
            </preact.Head>

            <h1>counter</h1>

            <CounterIsland title={'counter'} />

            <a href='/'>home</a>
        </div>
    );
}
