import carret from "../svg/icons/carret.svg";
import { IconProps } from "./types.ts";

export function CarretDown(
    { xmlns = "http://www.w3.org/2000/svg", viewBox = carret.viewBox, fill = "currentColor", ...rest }: IconProps,
) {
    return (
        <svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
            <use href={carret.href} transform="rotate(180, 128, 128)" />
        </svg>
    );
}
