import { PageResponse } from "../../../../page.ts";

export const type = "dynamic";

export const pattern = "/";

export function GET() {
    return new PageResponse({});
}

export function render() {
    return "Hello world";
}
