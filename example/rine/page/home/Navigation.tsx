import styles from "./Navigation.module.css";
import { clsx } from "../../dep/clsx.ts";
import { NAV_ID } from "./Navigation.script.ts";

export function Navigation() {
    return (
        <nav id={NAV_ID} class={clsx(styles["nav"])} aria-label="Main Menu">
            <img class={clsx(styles["logo"])} src="https://placeholder.pics/svg/200x100/DEDEDE/000/logo" />

            <ul class={clsx(styles["navlist"], styles["inpage"])}>
                <li>
                    <a href="#">About</a>
                </li>
                <li>
                    <a href="#">Team</a>
                </li>
                <li>
                    <a href="#">Upcoming Events</a>
                </li>
            </ul>

            <ul class={clsx(styles["navlist"], styles["global"])}>
                <li>
                    <a href="#">All Events</a>
                </li>
            </ul>
        </nav>
    );
}
