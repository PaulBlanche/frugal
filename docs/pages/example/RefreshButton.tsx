/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Session } from '../../dep/frugal/client_session.ts';

export function RefreshButton() {
    return (
        <button
            onClick={async () => {
                await Session.getInstance().navigate(
                    new URL('?force_refresh=refresh_key', location.href),
                );
            }}
        >
            Refresh Page
        </button>
    );
}
