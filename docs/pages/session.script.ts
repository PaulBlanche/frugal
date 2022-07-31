import { Session } from '../dep/frugal/frugal_session.ts';

export function main() {
    Session.getInstance().start();
}
