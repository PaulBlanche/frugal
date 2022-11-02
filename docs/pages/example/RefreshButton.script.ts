import { RefreshButton } from './RefreshButton.tsx';
import { hydrate } from '../../dep/frugal/preact.client.ts';

export const NAME = 'RefreshButton';

export function main() {
    hydrate(NAME, () => RefreshButton);
}
