/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Island } from '../../dep/frugal/preact.client.ts';

import { NAME } from './MobileToggle.script.ts';
import { MobileToggle as Component } from './MobileToggle.tsx';

export { DRAWER_CLASSNAME, OVERLAY_CLASSNAME } from './MobileToggle.tsx';

export function MobileToggle() {
    return <Island Component={Component} props={{}} name={NAME} />;
}
