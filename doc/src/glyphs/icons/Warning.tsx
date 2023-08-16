import warning from "./warning.svg";

export function Warning(
    { xmlns = "http://www.w3.org/2000/svg", viewBox = warning.viewBox, fill = "currentColor", ...rest }:
        preact.JSX.IntrinsicElements["svg"],
) {
    return (
        <svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
            <use href={warning.href} />
        </svg>
    );
}
