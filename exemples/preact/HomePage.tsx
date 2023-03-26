/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from '../../runtime/preact.server.ts';
import { Blob } from './Blob.tsx';

export function HomePage({ assets, descriptor }: preact.PageProps) {
    const styleHref = assets['style'][descriptor];

    return (
        <div>
            <preact.Head>
                <title>home</title>
                {styleHref && <link rel='stylesheet' href={styleHref} />}
                <link
                    href='https://fonts.googleapis.com/css2?family=Fjalla+One&display=swap'
                    rel='stylesheet'
                />
            </preact.Head>

            <h1>home</h1>

            <div>
                <Blob />
                <h1>frugal</h1>
            </div>

            <svg>
                <defs>
                    <filter id='blob'>
                        <feGaussianBlur stdDeviation='10'></feGaussianBlur>
                        <feColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 60 -30'>
                        </feColorMatrix>
                    </filter>
                </defs>
            </svg>
            <a href='/counter'>counter</a>
        </div>
    );
}
