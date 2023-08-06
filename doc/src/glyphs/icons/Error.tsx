import error from "./error.svg";

export function Error(
    { xmlns = "http://www.w3.org/2000/svg", viewBox = error.viewBox, fill = "currentColor", ...rest }:
        preact.JSX.IntrinsicElements["svg"],
) {
    return (
        <svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
            <use href={error.href} />
        </svg>
    );
}
