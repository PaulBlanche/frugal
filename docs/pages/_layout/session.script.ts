import { Session } from '../../dep/frugal/client_session.ts';

export function main() {
    Session.getInstance().start();
}
