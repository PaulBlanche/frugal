import * as preact from 'preact';

export type SvgProps = Omit<
    preact.JSX.IntrinsicElements['svg'],
    'viewBox' | 'xlmns' | 'fill'
>;
