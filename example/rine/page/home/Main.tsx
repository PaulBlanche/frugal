import { clsx } from "../../dep/clsx.ts";
import styles from "./Main.module.css";

export function Main(props: any) {
  return <main class={clsx(styles["main"])}>{props.children}</main>;
}
