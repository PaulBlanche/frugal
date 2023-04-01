/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { clsx } from '$dep/clsx.ts';

// @deno-types="frugal/css-module.d.ts"
import c from './HeroHeader.module.css';
import { CodeBlock } from '../../components/CodeBlock.tsx';

type HeroHeader = {
  className?: string;
};

export function HeroHeader({ className }: HeroHeader) {
  return (
    <header class={clsx(c['hero-header'], className)}>
      <h1 class={c['title']}>
        <span class={c['highlight']}>frugal</span>
      </h1>
      <p class={c['tagline']}>
        A web framework that waste not.
      </p>
      <CodeBlock
        class={c['code-block']}
        language='ts'
        code={`export const self = import.meta.url;

export const pattern = '/';

export function GET() {
  return new DataResponse({ hello: 'world' });
}

export function getContent({ data }) {
  return \`<html>
    <body>
      <h1>Hello \${data.hello} !</h1>
    </body>
  </html>\`;
}
`}
      />
    </header>
  );
}
