import { MobileToggle, Toggler } from './MobileToggle.tsx';
import { hydrate } from '../../dep/frugal/preact.client.ts';
import * as preact from 'preact';
import * as signal from 'preact/signals';

export const NAME = 'MobileToggle';

export function main() {
    console.log('main');
    const open = signal.signal(false);
    const toggler = new Toggler(open);
    toggler.mount();
    hydrate(NAME, () => () => preact.h(MobileToggle, { toggler }));
}
