import { DataResponse } from "../../../../page.ts";

export const type = "dynamic";

export const pattern = "/";

export function GET() {
    return new DataResponse({});
}

export function render() {
    return "Hello world";
}
