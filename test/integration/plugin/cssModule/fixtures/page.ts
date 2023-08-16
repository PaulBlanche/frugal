import style from "./main.module.css";

export const route = "/page";

export function render() {
    return JSON.stringify(style);
}
