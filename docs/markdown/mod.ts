import { marked } from '../dep/marked.ts';

import { CalloutExtension } from './CalloutExtension.ts';
import { Renderer } from './Renderer.ts';

marked.use({
    extensions: [new CalloutExtension()],
});

export function parse(markup: string) {
    return marked.parse(markup, {
        renderer: new Renderer(),
    });
}
