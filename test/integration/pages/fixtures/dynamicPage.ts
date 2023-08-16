import { DataResponse } from "../../../../mod.ts";

export const type = "dynamic";

export const route = "/";

export function GET() {
    return new DataResponse({});
}

export function render() {
    return "Hello world";
}
