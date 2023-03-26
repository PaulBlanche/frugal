import { Session } from "$dep/frugal/runtime/client_session.ts";

if (import.meta.main) {
  Session.getInstance().start();
}
