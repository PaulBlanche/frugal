import { DataResponse } from "../../../../page.ts";

export const type = "dynamic";

export const route = "/";

export function GET() {
    return new DataResponse({ data: {} });
}

export function render() {
    return "Hello world";
}
