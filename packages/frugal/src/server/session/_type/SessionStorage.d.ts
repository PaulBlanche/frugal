export type SessionData = Record<string, any>;

export interface SessionStorage {
    create(
        headers: Headers,
        data: SessionData,
        expires: number | undefined,
    ): Promise<string> | string;
    get(headers: Headers, id: string): Promise<SessionData | undefined> | SessionData | undefined;
    update(
        headers: Headers,
        id: string,
        data: SessionData,
        expires?: number | undefined,
    ): Promise<void> | void;
    delete(headers: Headers, id: string): Promise<void> | void;
}
