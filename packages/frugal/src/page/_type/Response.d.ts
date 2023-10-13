import { JSONValue } from "./JSONValue.js";
import { EmptyResponse, DataResponse } from "../Response.js";

export type PageResponse<DATA extends JSONValue> = EmptyResponse | DataResponse<DATA>;

export type ResponseInit = {
    headers?: HeadersInit;
    status?: number;
    forceDynamic?: boolean;
};

export interface Response<DATA> {
    headers: Headers;
    status: number | undefined;
    data: DATA;
    dataHash: string;
}
