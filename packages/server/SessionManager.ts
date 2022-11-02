import { Persistence } from '../core/mod.ts';
import { Frugal } from '../core/mod.ts';

import * as murmur from '../murmur/mod.ts';
import * as path from '../../dep/std/path.ts';

export class SessionManager {
    #persistence: Persistence;
    #frugal: Frugal;

    constructor(persistence: Persistence, frugal: Frugal) {
        this.#persistence = persistence;
        this.#frugal = frugal;
    }

    /**
     * Create a new session object with the given content.
     *
     * The session uses a persistence layer, and returns the id of the created
     * session
     */
    async set(content: string): Promise<string> {
        const sessionId = this.#getSessionId(content);
        const sessionPath = this.#sessionPath(sessionId);

        await this.#persistence.set(sessionPath, content);

        return sessionId;
    }

    /**
     * Get the content of the session.
     */
    async get(sessionId: string): Promise<string> {
        const sessionPath = this.#sessionPath(sessionId);

        return await this.#persistence.read(sessionPath);
    }

    /**
     * Delete the session.
     */
    async delete(sessionId: string): Promise<void> {
        const sessionPath = this.#sessionPath(sessionId);

        return await this.#persistence.delete(sessionPath);
    }

    #getSessionId(content: string): string {
        const uuid = crypto.randomUUID();
        return new murmur.Hash()
            .update(uuid)
            .update(content)
            .digest();
    }

    #sessionPath(sessionId: string): string {
        return path.resolve(
            this.#frugal.config.cacheDir,
            'session',
            sessionId,
        );
    }
}
